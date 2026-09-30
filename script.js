const FLOWBOT_API="https://floybot-backend-rs44.vercel.app";

const connect=document.getElementById("connectTikTok");

if(connect){
  connect.href=FLOWBOT_API+"/api/tiktok/oauth";
}

(async()=>{
  try{
    const r=await fetch(FLOWBOT_API+"/api/tiktok/status",{credentials:"include"});
    if(!r.ok)return;

    const data=await r.json();

    if(data.connected){
      const card=document.querySelector(".bot-card strong");
      const status=document.querySelector(".bot-card span");

      if(card)card.textContent="@"+(data.account.display_name||"connected");
      if(status)status.textContent="TikTok подключён";
      if(connect)connect.textContent="TikTok подключён ✓";
    }
  }catch(e){}
})();

const params=new URLSearchParams(location.search);

if(params.get("tiktok")==="connected"){
  history.replaceState({}, "", location.pathname+"#bot");
}

if(params.get("tiktok_error")){
  alert("Не удалось подключить TikTok: "+params.get("tiktok_error"));
  history.replaceState({}, "", location.pathname+"#bot");
}

const io=new IntersectionObserver(
  es=>es.forEach(e=>{
    if(e.isIntersecting){
      e.target.style.opacity=1;
      e.target.style.transform="translateY(0)";
      io.unobserve(e.target);
    }
  }),
  {threshold:.08}
);

document
  .querySelectorAll(".service-list article,.how article,.metrics>div,.section-head h2,.section-head p,.faq details,.bot-panel,.bot-top")
  .forEach((e,i)=>{
    e.style.opacity=0;
    e.style.transform="translateY(24px)";
    e.style.transition="opacity .7s ease,transform .7s ease";
    e.style.transitionDelay=(i%4)*.06+"s";
    io.observe(e);
  });
