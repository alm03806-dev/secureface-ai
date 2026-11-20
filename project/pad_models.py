\
"""SecureFace image-only PAD models. 0=bona fide, 1=spoof.
MobileNetV3 torchvision backbone; LwFLNet-style dual-stream is a PyTorch reconstruction;
GhostNet-AFF-style uses pretrained timm GhostNet features if available, with
adaptive weighting; neither is asserted to match original author training code exactly.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F

class ConvBNAct(nn.Sequential):
    def __init__(self, ci,co,k=3,s=1,groups=1):
        super().__init__(nn.Conv2d(ci,co,k,stride=s,padding=k//2,groups=groups,bias=False),
                         nn.BatchNorm2d(co),nn.ReLU(inplace=True))

class LWFLNetStyle(nn.Module):
    def __init__(self):
        super().__init__()
        self.shallow=nn.Sequential(ConvBNAct(3,24,5,2),nn.MaxPool2d(2),
            ConvBNAct(24,48,3,2),nn.AdaptiveAvgPool2d(1),nn.Flatten(),nn.Dropout(.25))
        self.deep=nn.Sequential(ConvBNAct(3,24,3,2),ConvBNAct(24,48,3,2),
            ConvBNAct(48,96,3,2),nn.AdaptiveAvgPool2d(1),nn.Flatten(),nn.Dropout(.35))
        self.head=nn.Sequential(nn.Linear(48+96,96),nn.ReLU(inplace=True),
            nn.Dropout(.3),nn.Linear(96,2))
    def forward(self,x):return self.head(torch.cat([self.shallow(x),self.deep(x)],1))

class GhostModule(nn.Module):
    def __init__(self,ci,co,ratio=2):
        super().__init__()
        intrinsic=(co+ratio-1)//ratio
        ghost=co-intrinsic
        self.primary=nn.Sequential(nn.Conv2d(ci,intrinsic,1,bias=False),nn.BatchNorm2d(intrinsic),nn.ReLU(inplace=True))
        self.cheap=nn.Sequential(nn.Conv2d(intrinsic,ghost,3,padding=1,groups=intrinsic,bias=False),
                   nn.BatchNorm2d(ghost),nn.ReLU(inplace=True)) if ghost==intrinsic else None
        self.co=co
    def forward(self,x):
        a=self.primary(x)
        if self.cheap is None:return a[:,:self.co]
        return torch.cat([a,self.cheap(a)],dim=1)[:,:self.co]

class NativeGhostFeatureNet(nn.Module):
    """Offline fallback, not official GhostNet; report separately in logs."""
    def __init__(self):
        super().__init__()
        self.stem=ConvBNAct(3,24,3,2)
        self.s1=nn.Sequential(GhostModule(24,32),ConvBNAct(32,32,3,2,groups=32))
        self.s2=nn.Sequential(GhostModule(32,64),ConvBNAct(64,64,3,2,groups=64))
        self.s3=nn.Sequential(GhostModule(64,128),ConvBNAct(128,128,3,2,groups=128))
    def forward(self,x):
        x=self.stem(x); a=self.s1(x); b=self.s2(a); c=self.s3(b)
        return [a,b,c]

class GhostAFFStyle(nn.Module):
    def __init__(self,pretrained=True):
        super().__init__()
        self.backbone_source='native_fallback'
        channels=[32,64,128]
        try:
            import timm
            try:
                model=timm.create_model('ghostnet_100',pretrained=pretrained,features_only=True)
                self.backbone_source='timm_ghostnet_100_pretrained' if pretrained else 'timm_ghostnet_100_random'
            except Exception as e:
                print('GhostNet pretrained weights unavailable:',str(e)[:140]);
                model=timm.create_model('ghostnet_100',pretrained=False,features_only=True)
                self.backbone_source='timm_ghostnet_100_random'
            self.backbone=model
            channels=list(model.feature_info.channels())[-3:]
        except Exception as e:
            print('timm missing/unsupported: using named local Ghost-style fallback',str(e)[:140])
            self.backbone=NativeGhostFeatureNet()
        d=128
        self.proj=nn.ModuleList([nn.Sequential(nn.Linear(c,d),nn.ReLU(inplace=True)) for c in channels])
        self.attn=nn.ModuleList([nn.Sequential(nn.Linear(d,32),nn.Tanh(),nn.Linear(32,1)) for _ in channels])
        self.head=nn.Sequential(nn.LayerNorm(d),nn.Dropout(.25),nn.Linear(d,2))
    def forward(self,x):
        f=self.backbone(x)[-3:]
        emb=[p(F.adaptive_avg_pool2d(v,1).flatten(1)) for p,v in zip(self.proj,f)]
        a=torch.softmax(torch.cat([s(e) for s,e in zip(self.attn,emb)],dim=1),dim=1)
        z=sum(a[:,i:i+1]*emb[i] for i in range(len(emb)))
        return self.head(z)

class MobileNetV3PAD(nn.Module):
    def __init__(self,pretrained=True):
        super().__init__()
        from torchvision.models import mobilenet_v3_large,MobileNet_V3_Large_Weights
        try:
            weights=MobileNet_V3_Large_Weights.DEFAULT if pretrained else None
            self.net=mobilenet_v3_large(weights=weights)
            self.pretrained_loaded=bool(pretrained)
        except Exception as e:
            print('MobileNetV3 pretrained weights unavailable:',str(e)[:140])
            self.net=mobilenet_v3_large(weights=None);self.pretrained_loaded=False
        di=self.net.classifier[-1].in_features
        self.net.classifier[-1]=nn.Linear(di,2)
    def forward(self,x):return self.net(x)

def build_model(name,pretrained=True):
    if name=='mobilenetv3':return MobileNetV3PAD(pretrained)
    if name=='lwflnet':return LWFLNetStyle()
    if name=='ghostaff':return GhostAFFStyle(pretrained)
    raise KeyError(name)
