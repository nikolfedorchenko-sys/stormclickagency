#!/bin/bash
# Рендер відеодайджесту ДВ у пісочниці Higgsfield.
# Очікує в поточній папці: a0..a7.mp3 (озвучка блоків), intro_card.png, outro_card.png,
# ov{i}_photo.png і ov{i}_card.png (з mk_dv.py), фото з фотобанку (назви в масиві photos).
set -e
ENC="-c:v libx264 -preset veryfast -crf 20 -r 30 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000"
AUD="aresample=48000,aformat=channel_layouts=stereo"
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
D0=$(dur a0.mp3); T0=$(python3 -c "print($D0+0.6)")
ffmpeg -y -loglevel error -loop 1 -framerate 30 -t $T0 -i intro_card.png -i a0.mp3 -filter_complex "[0:v]scale=1920:1080,setsar=1,fade=t=in:st=0:d=0.5,format=yuv420p[v];[1:a]$AUD,apad=pad_dur=0.6[a]" -map "[v]" -map "[a]" -t $T0 $ENC seg_0.mp4
photos=(energy-02 housing-01 rada-01 uriad-01 money-01 housing-02)   # по одному на новину
P=9   # секунд фото перед карткою
for i in $(seq 1 ${#photos[@]}); do
  ph=${photos[$((i-1))]}; D=$(dur a$i.mp3); C=$(python3 -c "print(max(4.0, $D - $P + 0.6))")
  ffmpeg -y -loglevel error -loop 1 -framerate 30 -t $P -i $ph.jpg -loop 1 -framerate 30 -t $C -i ov${i}_card.png -i a$i.mp3 -i ov${i}_photo.png -filter_complex "
  [0:v]scale=2304:1296:force_original_aspect_ratio=increase,crop=2304:1296,zoompan=z='min(zoom+0.0005,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,setsar=1[p];
  [p][3:v]overlay=0:0:format=auto[po];[1:v]scale=1920:1080,setsar=1,fps=30[c];
  [po][c]concat=n=2:v=1:a=0,format=yuv420p[v];[2:a]$AUD,apad=pad_dur=0.6[a]" -map "[v]" -map "[a]" $ENC -shortest seg_$i.mp4
done
N=${#photos[@]}; D7=$(dur a$((N+1)).mp3); T7=$(python3 -c "print($D7+1.2)")
ffmpeg -y -loglevel error -loop 1 -framerate 30 -t $T7 -i outro_card.png -i a$((N+1)).mp3 -filter_complex "[0:v]scale=1920:1080,setsar=1,fade=t=in:st=0:d=0.4,format=yuv420p[v];[1:a]$AUD,apad=pad_dur=1.2[a]" -map "[v]" -map "[a]" -t $T7 $ENC seg_$((N+1)).mp4
: > concat.txt; for s in $(seq 0 $((N+1))); do echo "file 'seg_$s.mp4'" >> concat.txt; done
ffmpeg -y -loglevel error -f concat -safe 0 -i concat.txt -c copy -movflags +faststart dv_digest.mp4
ffprobe -v error -show_entries format=duration,size -of csv=p=0 dv_digest.mp4
