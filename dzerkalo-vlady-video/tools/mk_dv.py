# -*- coding: utf-8 -*-
"""Плашки й картки відеодайджесту ДВ. Потрібні шрифти Literata/Onest і логотипи з brand/ у поточній папці.
Список blocks редагується під випуск: (рубрика, заголовок, «що це означає для тебе», мітка думки, думка, джерело, підпис фото, файл фото)."""
from PIL import Image, ImageDraw, ImageFont
W,H=1920,1080
PAPER=(244,242,237); INK=(18,20,24); MUTED=(90,95,104); RULE=(216,210,196); GLASS=(14,106,112); SOFT=(227,239,238)
LIT="Literata-ExtraBold.ttf"; LITB="Literata-Bold.ttf"; ON="Onest-Regular.ttf"; ONS="Onest-SemiBold.ttf"; ONB="Onest-Bold.ttf"
def F(p,s): return ImageFont.truetype(p,s)
def wrap(d,text,font,maxw):
    words=text.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if d.textlength(t,font=font)<=maxw: cur=t
        else: lines.append(cur); cur=w
    if cur: lines.append(cur)
    return lines
def draw_par(d,x,y,text,font,maxw,fill,lh):
    for ln in wrap(d,text,font,maxw):
        d.text((x,y),ln,font=font,fill=fill); y+=lh
    return y
wm=Image.open("dv-wordmark.png").convert("RGBA"); wm=wm.resize((int(wm.width*56/wm.height),56))
logo=Image.open("dv-logo.png").convert("RGBA")
def photo_overlay(name,rubric,title,source,credit):
    im=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(im); bh=300; y0=H-bh
    d.rectangle([0,y0,W,H],fill=PAPER+(255,)); d.rectangle([0,y0,W,y0+6],fill=GLASS+(255,))
    d.text((80,y0+34),rubric.upper(),font=F(ONB,24),fill=GLASS+(255,))
    draw_par(d,80,y0+70,title,F(LIT,50),1500,INK+(255,),58)
    d.text((80,y0+bh-56),"Джерело: "+source,font=F(ON,24),fill=MUTED+(255,))
    cw=int(d.textlength("Фото: "+credit,font=F(ON,20)))+28
    d.rectangle([W-80-cw,y0-48,W-80,y0-12],fill=(18,20,24,170))
    d.text((W-80-cw+14,y0-42),"Фото: "+credit,font=F(ON,20),fill=(244,242,237,255))
    d.rectangle([80,60,80+wm.width+40,60+96],fill=PAPER+(235,)); im.alpha_composite(wm,(100,80)); im.save(name)
def card(name,rubric,title,impact,note_label,note,source):
    im=Image.new("RGB",(W,H),PAPER); d=ImageDraw.Draw(im); im.paste(wm,(80,70),wm)
    d.line([(80,160),(W-80,160)],fill=RULE,width=2)
    d.text((80,200),rubric.upper(),font=F(ONB,26),fill=GLASS)
    y=draw_par(d,80,244,title,F(LIT,58),880,INK,66)
    d.text((80,y+30),"Джерело: "+source,font=F(ON,24),fill=MUTED)
    x1=1040; bw=W-80-x1; bh=420 if note else 560
    d.rectangle([x1,200,W-80,200+bh],fill=SOFT); d.rectangle([x1,200,x1+8,200+bh],fill=GLASS)
    d.text((x1+40,236),"ЩО ЦЕ ОЗНАЧАЄ ДЛЯ ТЕБЕ",font=F(ONB,22),fill=GLASS)
    draw_par(d,x1+40,284,impact,F(ONS,34),bw-80,INK,46)
    if note:
        ny=660; d.text((x1+40,ny),note_label.upper(),font=F(ONB,22),fill=MUTED)
        d.line([(x1,ny-4),(x1,ny+160)],fill=RULE,width=3); draw_par(d,x1+40,ny+40,note,F(ON,30),bw-80,INK,42)
    d.text((80,H-80),"Дзеркало влади · dzerkalo-vlady.com",font=F(ON,22),fill=MUTED); im.save(name)
def intro(date_text):
    im=Image.new("RGB",(W,H),PAPER); d=ImageDraw.Draw(im)
    lg=logo.resize((int(logo.width*300/logo.height),300)); im.paste(lg,((W-lg.width)//2,250),lg)
    d.text((W//2,600),date_text,font=F(ONS,34),fill=MUTED,anchor="mm")
    d.text((W//2,680),"Що вирішили за тебе",font=F(LIT,64),fill=INK,anchor="mm")
    d.rectangle([W//2-60,740,W//2+60,746],fill=GLASS); im.save("intro_card.png")
def outro():
    im=Image.new("RGB",(W,H),INK); d=ImageDraw.Draw(im)
    lgi=Image.open("dv-logo-inverse.png").convert("RGBA"); lgi=lgi.resize((int(lgi.width*260/lgi.height),260)); im.paste(lgi,((W-lgi.width)//2,200),lgi)
    d.text((W//2,540),"Влада – без фільтрів. Дивись, що вирішують за тебе.",font=F(LITB,40),fill=(242,239,232),anchor="mm")
    d.text((W//2,640),"Надіслати новину: t.me/dzerkalo_vlady_news_bot",font=F(ONS,32),fill=(95,179,174),anchor="mm")
    d.text((W//2,700),"t.me/dzerkalo_vlady · dzerkalo-vlady.com",font=F(ON,28),fill=(167,171,179),anchor="mm")
    d.text((W//2,H-80),"Голос у випуску згенеровано з дозволу редакції. Фото: Wikimedia Commons, автори вказані в кадрі.",font=F(ON,20),fill=(120,125,135),anchor="mm")
    im.save("outro_card.png")
if __name__=="__main__":
    blocks=[]  # заповнити під випуск, приклад – episodes/2026-11-01.md
    for i,(r,t,imp,nl,n,src,cr,ph) in enumerate(blocks,1):
        photo_overlay(f"ov{i}_photo.png",r,t,src,cr); card(f"ov{i}_card.png",r,t,imp,nl,n,src)
    intro("Неділя, 1 листопада 2026"); outro()
