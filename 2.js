
(function(){ if(!window.SchoolLive) return;
  function go(t){ var map={chat:'chat',channel:'chat',notifications:'notifications',circular:'circulars',schedule:'schedule'}; var id=map[t]||'notifications'; var b=document.querySelector('.menu-btn[onclick*="\''+id+'\'"]'); if(typeof showPage==='function') showPage(id,b); }
  SchoolLive.init({db:supabaseClient,navigate:go});
  SchoolLive.mountChat(document.getElementById('slChatRoot'));
  SchoolLive.mountNotifications(document.getElementById('slNotifRoot'));
  SchoolFx.hero(document.getElementById('dashboard'));
  var prev=SchoolSchedule.mountManager(document.getElementById('slSchedPreview'),{gradeId:'scheduleGrade',classId:'scheduleClass'});
  var ls=window.loadSchedule; if(typeof ls==='function'){ window.loadSchedule=async function(){ var r=await ls.apply(this,arguments); var el=document.getElementById('slSchedPreview'); if(el&&el._reload) el._reload(); return r; }; }
})();
