const _$ = (s,root=document)=>root.querySelector(s);
    const _$$ = (s,root=document)=>[...root.querySelectorAll(s)];

    // ------- Minimal state & helpers -------
    const ROOM_STATE = {
      name: localStorage.getItem('pv_name') || 'Guest',
      rooms: JSON.parse(localStorage.getItem('pv_rooms')||'[]'),
      currentRoom: null,
      follows: JSON.parse(localStorage.getItem('pv_follows')||'[]'),
      topic: localStorage.getItem('pv_topic') || '',
      pins: JSON.parse(localStorage.getItem('pv_pins')||'[]'),
      slow: localStorage.getItem('pv_slow')==='1',
      locked: localStorage.getItem('pv_locked_room')==='1',
      ephemeral: localStorage.getItem('pv_ephem')==='1',
    };
    function roomSave(k,v){ localStorage.setItem(k, typeof v==='string'? v : JSON.stringify(v)); }
    function roomNow(){ return new Date().toLocaleTimeString(); }

    // ------- Presence (same-device demo) -------
    let bc=null; let online=new Set(); const selfId=Math.random().toString(36).slice(2,7).toUpperCase();
    function startPresence(){ try{
      bc=new BroadcastChannel('playverse-presence');
      bc.onmessage=(e)=>{ const d=e.data||{};
        if(d.type==='hello'){ online.add(d.id); updatePresenceCount(); bc.postMessage({type:'ack', id:selfId}); }
        if(d.type==='ack'){ online.add(d.id); updatePresenceCount(); }
        if(d.type==='bye'){ online.delete(d.id); updatePresenceCount(); }
        if(d.type==='room' && d.room===ROOM_STATE.currentRoom && d.name){ addPresence(d.name); }
        if(d.type==='typing' && d.room===ROOM_STATE.currentRoom && d.name!==ROOM_STATE.name){ showTyping(d.name); }
      };
      bc.postMessage({type:'hello', id:selfId});
      window.addEventListener('beforeunload', ()=> bc.postMessage({type:'bye', id:selfId}));
    }catch(_){}
    }
    function updatePresenceCount(){ _$('#onlineCount').textContent=String(online.size+1); }

    // ------- Room list UI -------
    function renderRooms(){ const box=_$('#myRooms'); box.innerHTML = ROOM_STATE.rooms.map(code=>`<div class="room-item"><span class="code">${code}</span><span class="link" data-join="${code}" style="color:var(--accent);cursor:pointer">Join</span></div>`).join('') || '<small class="muted">None yet</small>'; }

    // ------- Chat UI -------
    let lastSend = 0;
    function addMsg({id, text='',html='',me=false,meta='',replies=[]}){
      const wrap=_$('#msgs'); const d=document.createElement('div'); d.className='msg'+(me?' me':''); d.dataset.id=id || Math.random().toString(36).slice(2);
      const bubble=document.createElement('div'); bubble.className='bubble';
      bubble.innerHTML = html || (text ? text.replace(/https?:\/\/\S+/g, u=>`<a href="${u}" target="_blank">${u}</a>`) : '');
      const actions=document.createElement('div'); actions.className='actions';
      actions.innerHTML = `
        <button data-react="👍" title="React">👍</button>
        <button data-react="❤️" title="React">❤️</button>
        <button data-reply title="Reply">💬</button>
        <button data-pin title="Pin">📌</button>
        <button data-del title="Delete">🗑️</button>`;
      bubble.appendChild(actions);
      const react=document.createElement('div'); react.className='reactions';
      const metaEl=document.createElement('div'); metaEl.className='meta'; metaEl.innerHTML = `${meta || roomNow()} <span class="badge">${me?'seen • me':'delivered'}</span>`;
      d.appendChild(bubble); d.appendChild(react); d.appendChild(metaEl);

      if(replies && replies.length){ const thread=document.createElement('div'); thread.style.marginTop='6px'; thread.style.borderLeft='2px solid var(--line)'; thread.style.paddingLeft='8px'; thread.innerHTML = replies.map(r=>`<div class="bubble" style="max-width:62%">${r}</div>`).join(''); d.appendChild(thread); }

      wrap.appendChild(d); wrap.scrollTop=wrap.scrollHeight;
    }

    function addPresence(name){ const chip=document.createElement('div'); chip.className='p';
      const following = ROOM_STATE.follows.includes(name);
      chip.innerHTML = `<span>👤 ${name}</span><button class="toolbar btn" data-follow="${name}">${following?'Following ✓':'Follow'}</button>`;
      _$('#presence').appendChild(chip);
    }

    function showTyping(name){ const t=_$('#typing'); t.textContent=`${name} is typing…`; clearTimeout(showTyping._h); showTyping._h=setTimeout(()=> t.textContent='', 1200); }

    // ------- Lightbox --------
    const lb=_$('#lightbox'); const lbImg=_$('#lightboxImg');
    _$('#msgs').addEventListener('click',(e)=>{
      const img=e.target.closest('img'); const v=e.target.closest('video');
      if(img){ lbImg.replaceWith(lbImg.cloneNode(true)); const n=_$('#lightboxImg'); n.src=img.src; lb.setAttribute('open',''); }
      if(v){ lb.innerHTML='<video id="lbVid" controls></video>'; _$('#lbVid').src=v.currentSrc||v.src; lb.setAttribute('open',''); }
    });
    lb.addEventListener('click',()=> lb.removeAttribute('open'));

    // ------- Pins & Polls modals -------
    const modal=_$('#modal'); const sheet=_$('#modalSheet');
    function openPins(){ sheet.innerHTML = `<h3>📌 Pinned</h3>${ROOM_STATE.pins.length? '<ul>'+ROOM_STATE.pins.map(p=>`<li>${p}</li>`).join('')+'</ul>':'<p class="muted">Nothing pinned yet</p>'}<div style="text-align:right"><button id="closeModal" class="toolbar btn">Close</button></div>`; modal.setAttribute('open',''); }
    function openPoll(){ sheet.innerHTML = `<h3>📊 Create Poll</h3>
      <input id="pollQ" placeholder="Question">
      <input class="pollOpt" placeholder="Option 1">
      <input class="pollOpt" placeholder="Option 2">
      <button id="addOpt" class="toolbar btn">+ Add option</button>
      <div style="text-align:right;margin-top:8px"><button id="postPoll" class="toolbar btn p">Post</button></div>`; modal.setAttribute('open','');
      _$('#addOpt').onclick=()=>{ const i=document.createElement('input'); i.className='pollOpt'; i.placeholder='Another option'; sheet.insertBefore(i, sheet.lastElementChild); };
      _$('#postPoll').onclick=()=>{
        const q=_$('#pollQ').value.trim(); const opts=[...$_$('.pollOpt')].map(i=>i.value.trim()).filter(Boolean);
        if(!q||opts.length<2) return alert('Enter a question and 2+ options');
        postPoll(q, opts); modal.removeAttribute('open');
      };
      _$('#closeModal').onclick=()=> modal.removeAttribute('open');
    }
    sheet.addEventListener('click', (e)=>{ if(e.target.id==='closeModal') modal.removeAttribute('open'); });

    // ------- Messaging actions -------
    function broadcastPayload(obj){ Object.values(peers).forEach(p=>{ if(p.dc && p.dc.readyState==='open'){ p.dc.send(JSON.stringify(obj)); } }); try{ bc && bc.postMessage(obj.type==='typing'? {type:'typing', room:ROOM_STATE.currentRoom, name:ROOM_STATE.name} : {type:'noop'}); }catch(_){ }
    }

    function sendText(){
      const val=(_$('#chatInput').value||'').trim(); if(!val) return;
      if(ROOM_STATE.slow){ const nowt=Date.roomNow(); if(nowt-lastSend < 3000) return addMsg({text:'⌛ Slow mode: wait a moment…', me:false}); lastSend=nowt; }
      const id=Math.random().toString(36).slice(2);
      addMsg({id, text:`Me: ${val}`, me:true});
      const pkt={kind:'text', from:ROOM_STATE.name, text:val, id, room:ROOM_STATE.currentRoom};
      broadcastPayload(pkt);
      _$('#chatInput').value='';
      if(ROOM_STATE.ephemeral){ setTimeout(()=> deleteMsg(id, true), 10000); }
    }

    function deleteMsg(id, localOnly){ const el=_$(`[data-id="${id}"]`); if(el) el.remove(); if(!localOnly) broadcastPayload({kind:'delete', id}); }

    function handleData(pkt){
      if(pkt.kind==='text'){ addMsg({id:pkt.id, text:`${pkt.from}: ${pkt.text}`, meta:roomNow()}); }
      if(pkt.kind==='file'){ const a=`<a download="${pkt.name}" href="${pkt.url}">📎 ${pkt.name}</a>`; addMsg({id:pkt.id, html:`${pkt.from}: ${a}`, meta:roomNow()}); }
      if(pkt.kind==='image'){ const img=`<img src="${pkt.url}" alt="image" style="max-width:320px;border-radius:8px;border:1px solid var(--line)">`; addMsg({id:pkt.id, html:`${pkt.from}:<br>${img}`, meta:roomNow()}); }
      if(pkt.kind==='voice'){ const au=`<audio controls src="${pkt.url}"></audio>`; addMsg({id:pkt.id, html:`${pkt.from}: 🎤 Voice note<br>${au}`, meta:roomNow()}); }
      if(pkt.kind==='poll'){ renderPoll(pkt); }
      if(pkt.kind==='vote'){ updateVote(pkt); }
      if(pkt.kind==='pin'){ ROOM_STATE.pins.push(pkt.text); roomSave('pv_pins', ROOM_STATE.pins); }
      if(pkt.kind==='delete'){ deleteMsg(pkt.id, true); }
    }

    _$('#msgs').addEventListener('click',(e)=>{
      const reactBtn=e.target.closest('[data-react]');
      const pinBtn=e.target.closest('[data-pin]');
      const delBtn=e.target.closest('[data-del]');
      const replyBtn=e.target.closest('[data-reply]');
      const msg=e.target.closest('.msg'); if(!msg) return;
      if(reactBtn){ const r=reactBtn.dataset.react; const row=msg.querySelector('.reactions'); const tag=document.createElement('span'); tag.textContent=r; row.appendChild(tag); }
      if(pinBtn){ const text=msg.querySelector('.bubble').innerText.slice(0,120); ROOM_STATE.pins.push(text); roomSave('pv_pins', ROOM_STATE.pins); broadcastPayload({kind:'pin', text}); }
      if(delBtn){ const id=msg.dataset.id; deleteMsg(id); }
      if(replyBtn){ const reply=prompt('Reply text'); if(reply){ const r=document.createElement('div'); r.className='bubble'; r.style.maxWidth='62%'; r.textContent=reply; msg.appendChild(r); }
    });

    // typing indicator
    _$('#chatInput').addEventListener('input', ()=> broadcastPayload({type:'typing', room:ROOM_STATE.currentRoom, name:ROOM_STATE.name}));

    _$('#sendBtn').addEventListener('click', sendText);
    _$('#chatInput').addEventListener('keydown', e=>{ if(e.key==='Enter') sendText(); if(e.code==='Space' && e.ctrlKey) startPTT(); });

    // Files & images
    _$('#attachBtn').addEventListener('click', ()=> _$('#filePicker').click());
    _$('#filePicker').addEventListener('change', async (e)=>{
      const files=[...e.target.files]; for(const f of files){ const url=URL.createObjectURL(f); const id=Math.random().toString(36).slice(2);
        const isImg = /^image\//.test(f.type); const isVid=/^video\//.test(f.type);
        if(isImg){ addMsg({id, html:`Me:<br><img src="${url}" style="max-width:320px;border-radius:8px;border:1px solid var(--line)">`, me:true}); broadcastPayload({kind:'image', from:ROOM_STATE.name, name:f.name, mime:f.type, url, id}); }
        else if(isVid){ addMsg({id, html:`Me:<br><video controls src="${url}"></video>`, me:true}); broadcastPayload({kind:'file', from:ROOM_STATE.name, name:f.name, mime:f.type, url, id}); }
        else { addMsg({id, html:`Me: <a download="${f.name}" href="${url}">📎 ${f.name}</a>`, me:true}); broadcastPayload({kind:'file', from:ROOM_STATE.name, name:f.name, mime:f.type, url, id}); }
        if(ROOM_STATE.ephemeral){ setTimeout(()=> deleteMsg(id, true), 10000); }
      }
      e.target.value='';
    });

    // Voice notes (push-to-talk)
    let rec=null; let chunks=[]; let ptt=false;
    function startPTT(){ if(ptt) return; ptt=true; navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
      rec=new MediaRecorder(stream, {mimeType:'audio/webm'}); chunks=[]; rec.ondataavailable=(ev)=>ev.data && chunks.push(ev.data);
      rec.onstop=()=>{ const blob=new Blob(chunks,{type:'audio/webm'}); const url=URL.createObjectURL(blob); const id=Math.random().toString(36).slice(2);
        addMsg({id, html:`Me: 🎤 Voice note<br><audio controls src="${url}"></audio>`, me:true}); broadcastPayload({kind:'voice', from:ROOM_STATE.name, url, id}); chunks=[]; stream.getTracks().forEach(t=>t.stop()); ptt=false; };
      rec.start(); addMsg({text:'🎤 Recording… release Space to stop', me:true});
      const stopPTT=(e)=>{ if(e.code==='Space'){ document.removeEventListener('keyup', stopPTT); rec && rec.stop(); } };
      document.addEventListener('keyup', stopPTT);
    }); }

    _$('#micBtn').addEventListener('mousedown', startPTT);

    // Polls
    function postPoll(q,opts){ const id='poll_'+Math.random().toString(36).slice(2); const pkt={kind:'poll', id, q, opts:opts.map((o,i)=>({t:o,c:0,i}))}; broadcastPayload(pkt); renderPoll(pkt,true); }
    function renderPoll(pkt,me){ const wrap=document.createElement('div'); wrap.className='msg'+(me?' me':''); wrap.dataset.id=pkt.id; const optBtns=pkt.opts.map(o=>`<button class="toolbar btn" data-vote="${o.i}">${o.t} <span class="badge" data-count="${o.i}">${o.c}</span></button>`).join(' ');
      wrap.innerHTML = `<div class="bubble"><strong>📊 ${pkt.q}</strong><div style="margin-top:6px">${optBtns}</div></div><div class="meta">${roomNow()}</div>`;
      _$('#msgs').appendChild(wrap); _$('#msgs').scrollTop=_$('#msgs').scrollHeight;
    }
    function updateVote(pkt){ const box=_$(`[data-id="${pkt.id}"]`); if(!box) return; const badge=box.querySelector(`[data-count="${pkt.choice}"]`); if(badge){ const n=Number(badge.textContent||'0')+1; badge.textContent=n; } }
    _$('#newPoll').addEventListener('click', openPoll);
    _$('#pinBoardBtn').addEventListener('click', openPins);

    _$('#recordLocal').addEventListener('click', async()=>{
      try{ const s=await navigator.mediaDevices.getUserMedia({audio:true}); const mr=new MediaRecorder(s); const chunks=[]; mr.ondataavailable=(e)=>e.data&&chunks.push(e.data); mr.onstop=()=>{ const blob=new Blob(chunks,{type:'audio/webm'}); const url=URL.createObjectURL(blob); addMsg({html:`Local recording saved. <a href="${url}" download="recording.webm">Download</a>`}); s.getTracks().forEach(t=>t.stop()); }; mr.start(); setTimeout(()=> mr.stop(), 5000); addMsg({text:'⏺️ Recording 5s…', me:false}); }catch(_){ addMsg({text:'Recording not allowed', me:false}); }
    });

    // Topic
    _$('#saveTopic').addEventListener('click', ()=>{ const t=_$('#roomTopic').value.trim(); ROOM_STATE.topic=t; roomSave('pv_topic', t); addMsg({text:`📝 Topic set: ${t}`}); });

    // Lock / Slow / Ephemeral toggles
    _$('#slowMode').checked = ROOM_STATE.slow; _$('#ephemeral').checked = ROOM_STATE.ephemeral; _$('#lockRoom').checked = ROOM_STATE.locked;
    _$('#slowMode').addEventListener('change', e=>{ ROOM_STATE.slow=e.target.checked; roomSave('pv_slow', ROOM_STATE.slow?'1':'0'); });
    _$('#ephemeral').addEventListener('change', e=>{ ROOM_STATE.ephemeral=e.target.checked; roomSave('pv_ephem', ROOM_STATE.ephemeral?'1':'0'); });
    _$('#lockRoom').addEventListener('change', e=>{ ROOM_STATE.locked=e.target.checked; roomSave('pv_locked_room', ROOM_STATE.locked?'1':'0'); });

    // Invite
    _$('#copyInvite').addEventListener('click', async()=>{
      if(!ROOM_STATE.currentRoom) return alert('Join a room first');
      const link = location.origin+location.pathname+`?room=${ROOM_STATE.currentRoom}`;
      try{ await navigator.clipboard.writeText(link); addMsg({text:'🔗 Invite link copied!'}); }catch(_){ addMsg({text:link}); }
    });

    // ------- Simple Signaling via WebSocket (replace with your server) -------
    const SIGNAL_URL = 'wss://your-signal-server.example/ws'; // TODO set real URL
    let ws=null; let wsReady=false; let peers={};

    function connectSignal(){ try{
      ws = new WebSocket(SIGNAL_URL);
      ws.onopen=()=>{ wsReady=true; if(ROOM_STATE.currentRoom) ws.send(JSON.stringify({t:'join', room:ROOM_STATE.currentRoom, name:ROOM_STATE.name})); };
      ws.onmessage=(ev)=>{ const m=JSON.parse(ev.data||'{}'); handleSignal(m); };
      ws.onclose=()=>{ wsReady=false; };
    }catch(err){ console.warn('signal unavailable, same‑device demo only'); }
    }

    function sendSignal(m){ if(wsReady) ws.send(JSON.stringify(m)); }

    // ------- WebRTC setup -------
    const RTC_CFG = { iceServers: [{urls:'stun:stun.l.google.com:19302'}] };
    const localVideo=_$('#localVideo'); const mediaGrid=_$('#mediaGrid'); const remoteWrap=_$('#remoteVideos');
    let blurOn=false;

    function newPeer(remoteId){
      const pc=new RTCPeerConnection(RTC_CFG);
      pc.onicecandidate = (e)=>{ if(e.candidate) sendSignal({t:'ice', to:remoteId, from:selfId, cand:e.candidate}); };
      pc.ontrack = (e)=>{ attachRemoteStream(remoteId, e.streams[0]); };
      // Data channel for chat/polls/etc.
      const dc = pc.createDataChannel('chat', {ordered:true});
      wireDataChannel(remoteId, dc);
      pc.ondatachannel = (e)=> wireDataChannel(remoteId, e.channel);
      peers[remoteId] = {pc, dc, streams:{}};
      return pc;
    }

    function wireDataChannel(remoteId, dc){
      peers[remoteId] = peers[remoteId]||{}; peers[remoteId].dc = dc;
      dc.onopen = ()=> addMsg({text:`Connected to ${remoteId}`});
      dc.onmessage = (ev)=> handleData(JSON.parse(ev.data));
    }

    async function startCall(video=false){
      const stream = await navigator.mediaDevices.getUserMedia({audio:true, video});
      localVideo.srcObject = stream; mediaGrid.style.display='grid';
      if(blurOn) localVideo.style.filter='blur(6px)';
      Object.values(peers).forEach(p=> stream.getTracks().forEach(t=> p.pc.addTrack(t, stream)));
    }
    async function shareScreen(){ const stream = await navigator.mediaDevices.getDisplayMedia({video:true, audio:true}).catch(()=>null); if(!stream) return; Object.values(peers).forEach(p=> stream.getTracks().forEach(t=> p.pc.addTrack(t, stream))); }
    function hangup(){ Object.values(peers).forEach(p=>{ try{ p.pc.getSenders().forEach(s=> s.track && s.track.stop()); p.pc.close(); }catch(_){} }); peers={}; localVideo.srcObject=null; mediaGrid.style.display='none'; remoteWrap.innerHTML=''; connectToRoom(ROOM_STATE.currentRoom, true); }
    function attachRemoteStream(id, stream){ let v=_$(`#rv-${id}`); if(!v){ const box=document.createElement('video'); box.id=`rv-${id}`; box.autoplay=true; box.playsInline=true; remoteWrap.appendChild(box); v=box; } v.srcObject=stream; }

    // Video blur toggle (visual only)
    _$('#toggleBlur').addEventListener('click', ()=>{ blurOn=!blurOn; localVideo && (localVideo.style.filter = blurOn? 'blur(6px)':'none'); });

    // ------- Signaling message handling -------
    async function handleSignal(m){
      if(m.t==='joined' && m.room===ROOM_STATE.currentRoom){ _$('#presence').innerHTML=''; (m.peers||[]).forEach(p=> addPresence(p.name||p.id)); }
      if(m.t==='offer' && m.to===selfId){ const pc = newPeer(m.from); await pc.setRemoteDescription(m.sdp); const ans = await pc.createAnswer(); await pc.setLocalDescription(ans); sendSignal({t:'answer', to:m.from, from:selfId, sdp:ans}); }
      if(m.t==='answer' && m.to===selfId){ const p = peers[m.from]; if(p) await p.pc.setRemoteDescription(m.sdp); }
      if(m.t==='ice' && m.to===selfId){ const p = peers[m.from]; if(p) await p.pc.addIceCandidate(m.cand); }
      if(m.t==='hello' && m.room===ROOM_STATE.currentRoom && m.from!==selfId){ const pc = newPeer(m.from); const offer = await pc.createOffer(); await pc.setLocalDescription(offer); sendSignal({t:'offer', to:m.from, from:selfId, sdp:offer}); }
    }

    // ------- Room connect / create / join -------
    function connectToRoom(code, rejoin=false){ if(!code) return; if(ROOM_STATE.locked && !rejoin && ROOM_STATE.rooms.indexOf(code)===-1){ return alert('Room is locked'); }
      ROOM_STATE.currentRoom=code; roomSave('pv_room_current', code); _$('#roomLabel').textContent=code; _$('#presence').innerHTML='';
      if(wsReady){ sendSignal({t:'join', room:code, name:ROOM_STATE.name}); setTimeout(()=> sendSignal({t:'hello', room:code, from:selfId}), 300); }
      try{ bc && bc.postMessage({type:'room', room:code, name:ROOM_STATE.name}); }catch(_){ }
      if(!rejoin){ addMsg({text:`Joined room ${code}`}); }
      _$('#roomTopic').value = ROOM_STATE.topic;
    }

    _$('#createRoom').addEventListener('click',()=>{ const code=Math.random().toString(36).slice(2,7).toUpperCase(); ROOM_STATE.rooms.push(code); roomSave('pv_rooms', ROOM_STATE.rooms); renderRooms(); connectToRoom(code); });
    _$('#joinBtn').addEventListener('click',()=>{ const c=(_$('#joinCode').value||'').trim().toUpperCase(); if(!c) return; connectToRoom(c); });
    _$('#myRooms').addEventListener('click', (e)=>{ const a=e.target.closest('[data-join]'); if(a) connectToRoom(a.dataset.join); });

    // Chat buttons
    _$('#callAudio').addEventListener('click', ()=> startCall(false));
    _$('#callVideo').addEventListener('click', ()=> startCall(true));
    _$('#screenShare').addEventListener('click', shareScreen);
    _$('#hangup').addEventListener('click', hangup);
    _$('#camBtn').addEventListener('click', async()=>{ await startCall(true); });

    // Attach actions to global
    window.addEventListener('keydown', (e)=>{ if(e.code==='Space' && !e.repeat && document.activeElement!==_$('#chatInput')) startPTT(); });

    // INIT
    function init(){ renderRooms(); startPresence(); connectSignal(); const last = localStorage.getItem('pv_room_current'); if(last) connectToRoom(last); }
    init();