const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

function detectPositionFake(){
  return "bottom-right"; // smart default
}

function getOverlay(pos){
  if(pos==="auto") pos = detectPositionFake();
  switch(pos){
    case "top-left": return "10:10";
    case "top-right": return "W-w-10:10";
    case "bottom-left": return "10:H-h-10";
    default: return "W-w-10:H-h-10";
  }
}

async function start(){
  const video = document.getElementById('videoInput').files[0];
  const logo = document.getElementById('logoInput').files[0];
  const pos = document.getElementById('position').value;
  const status = document.getElementById('status');
  const preview = document.getElementById('preview');

  if(!video) return alert("Upload video");

  status.innerText="Loading...";
  if(!ffmpeg.isLoaded()) await ffmpeg.load();

  ffmpeg.FS('writeFile','input.mp4',await fetchFile(video));
  if(logo){
    ffmpeg.FS('writeFile','logo.png',await fetchFile(logo));
  }

  status.innerText="Processing (AI-like)...";

  const overlay = getOverlay(pos);

  await ffmpeg.run(
    '-i','input.mp4',
    '-i','logo.png',
    '-filter_complex',`boxblur=5:1,overlay=${overlay}`,
    '-preset','ultrafast',
    '-r','30',
    'output.mp4'
  );

  const data = ffmpeg.FS('readFile','output.mp4');
  const url = URL.createObjectURL(new Blob([data.buffer],{type:'video/mp4'}));

  preview.src=url;

  const a=document.createElement('a');
  a.href=url;
  a.download="output.mp4";
  a.click();

  status.innerText="✅ Done";
}
