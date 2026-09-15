    'use strict';
    const $ = (selector) => document.querySelector(selector);
    const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
    const initial = () => ({
      spots: [
        {id:'pier4',name:'Pier 4, Brooklyn',lat:40.6945,lon:-73.9994,notes:'Example spot and approximate coordinates only. Check access, posted rules, and current regulations independently.',sample:true},
        {id:'pier5',name:'Pier 5, Brooklyn',lat:40.6922,lon:-74.0013,notes:'A second illustrative NYC pier. Not an endorsement or a verified fishing location.',sample:true}
      ],
      catches: [
        {id:'catch1',species:'Striped bass',date:'2026-06-14T07:42',spotId:'pier4',spotName:'Pier 4, Brooklyn',length:'24',bait:'Paddle tail',notes:'A cool, quiet morning by the water. Example entry only.',sample:true},
        {id:'catch2',species:'Fluke',date:'2026-06-12T16:20',spotId:'pier5',spotName:'Pier 5, Brooklyn',length:'16',bait:'Bucktail',notes:'An example of a shorter afternoon outing.',sample:true},
        {id:'catch3',species:'Striped bass',date:'2026-06-09T06:15',spotId:'pier4',spotName:'Pier 4, Brooklyn',length:'',bait:'',notes:'',sample:true}
      ]
    });
    let stores = {sample:initial(),first:{spots:[],catches:[]}};
    let mode = 'sample', tab = 'journal', spotView = 'list', openSpotId = '', spotsScroll = 0, counter = 0, returnFocus = null;
    let lastSpots = {sample:'',first:''}, pageResizeObserver = null;
    let formSession = null, cancelSheet = null, sheetContext = '';
    let locationPermissions = {sample:'not requested',first:'not requested'};
    let cameraPermissions = {sample:'not requested',first:'not requested'};
    const photoFixtures = {bass:'Striped bass',fluke:'Fluke'};
    function photoHTML(fixture) {
      if (!photoFixtures[fixture]) return '';
      const scene=fixture==='bass'
        ? '<path d="M72 81 34 52v59l38-30c48-51 147-54 206 0-59 54-158 51-206 0Z" fill="#becdc5" stroke="#314c42" stroke-width="3"/><path d="m130 43 35-22 36 25m-73 15h87m-94 15h96m-94 15h90m-78 15h67m22-53q-16 28 0 54" fill="none" stroke="#536e60" stroke-width="3"/><circle cx="254" cy="72" r="5" fill="#263d31"/>'
        : '<path d="M78 82 41 58v47l37-23c59-90 141-89 196 0-55 90-137 89-196 0Z" fill="#a8af84" stroke="#4e634a" stroke-width="3"/><path d="M119 41q42 42 0 82m31-96 10 110m29-111 9 108" stroke="#758365" fill="none" stroke-width="3"/><circle cx="238" cy="69" r="5" fill="#263d31"/><circle cx="249" cy="83" r="5" fill="#263d31"/>';
      return `<figure class="sample-photo"><svg viewBox="0 0 320 160" role="img" aria-label="${photoFixtures[fixture]} — original synthetic illustration"><path fill="#e9e4d6" d="M0 0h320v160H0z"/><path d="M0 35h320M0 125h320" stroke="#d1cbbb"/>${scene}</svg><figcaption>Sample fish image · ${photoFixtures[fixture]} · illustration, not a real photo</figcaption></figure>`;
    }
    const data = () => stores[mode];
    const rememberedSpot = () => data().spots.find(s=>s.id===lastSpots[mode]) || data().spots[0];
    const activeContent = () => openSpotId ? $(`[data-page-spot="${openSpotId}"]`) : $('#panel');
    const newId = () => `new-${++counter}`;
    const nowLocal = () => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    };
    const dateLabel = (date, options) => new Date(date).toLocaleString('en-US',options);
    const announce = (message) => { $('#status').textContent = message; };
    const emptyView = (name, title, text, action, label) => `<section class="empty">${icon(name)}<h3>${title}</h3><p>${text}</p><button type="button" class="primary" data-action="${action}">${label}</button></section>`;
    function catchRows(catches) {
      return [...catches].sort((a,b)=>b.date.localeCompare(a.date)).map(c => `<button type="button" class="entry" data-catch="${escapeHTML(c.id)}" aria-label="View ${escapeHTML(c.species)}, ${escapeHTML(dateLabel(c.date,{month:'short',day:'numeric',year:'numeric'}))}">
        <span class="entry-art">${icon(c.species.toLowerCase()==='fluke'?'fluke':'fish')}</span>
        <span class="entry-main"><strong>${escapeHTML(c.species)}</strong><small>${escapeHTML(c.spotName || 'No spot recorded')}</small><small>${escapeHTML(dateLabel(c.date,{month:'short',day:'numeric',year:'numeric'}))} · ${c.sample?'Sample':'Your demo entry'}</small></span>
        <span class="entry-end">${c.length?`${escapeHTML(c.length)} in`:'—'}<small>${escapeHTML(dateLabel(c.date,{hour:'numeric',minute:'2-digit'}))}</small></span>
      </button>`).join('');
    }
    function journalHTML() {
      if (!data().catches.length) return emptyView('book','Every outing starts<br>with a first entry.','Keep the species, the place, and the little things worth remembering. No saved spot needed.','add-catch','Log your first catch') + '<p class="footnote">Nothing is saved on this device by this wireframe. The future native journal will store entries on-device.</p>';
      return `<div class="section-label"><span>Recent catches</span><span>${data().catches.length} entries</span></div><div class="native-list">${catchRows(data().catches)}</div><p class="footnote">Phase 1 · on-device journal planned. This preview keeps changes in memory only. Example sizes do not imply legal retention. Times use your device’s timezone.</p>`;
    }
    function mapHTML() {
      return `<figure class="map-figure"><svg class="map" viewBox="0 0 320 235" role="img" aria-labelledby="map-title map-desc">
        <title id="map-title">Illustrative map — not for navigation</title><desc id="map-desc">An abstract shoreline sketch, not a geographic basemap. Saved coordinates are available in the spot list below; markers are not plotted.</desc>
        <path d="M172-10 170 30 182 64 209 91 212 123 244 157 260 190 284 245H330V-10Z" fill="#d1dbc7"/>
        <path d="m174 6 14 21m-6 17 23 14m4 24 18-5m-3 29 22-5m-7 35 24-7m3 32 25-7m-10 35 21-8" fill="none" stroke="#f5f3ec" stroke-width="7"/>
        <path d="M191 87 143 105l6 11 48-18m23 47-45 22 6 12 47-23" fill="#d1dbc7" stroke="#6b8569"/>
        <path d="m45 67 8-3m-25 94 42-16m-2 39 44-17M111 28l27-10" stroke="#adbeaa" fill="none"/>
        <text x="27" y="110" font-family="Georgia,serif" font-size="17" fill="#526c5a" transform="rotate(-20 27 110)">East River</text>
        <text x="211" y="52" font-family="sans-serif" font-size="9" fill="#3f5e47" transform="rotate(48 211 52)">BROOKLYN</text>
        <text x="15" y="218" font-family="sans-serif" font-size="9" fill="#526c5a">SHORELINE STUDY / NOT TO SCALE</text>
      </svg><figcaption>Illustrative map - not for navigation. No plotted locations.</figcaption></figure>`;
    }
    function spotsHTML() {
      if (!data().spots.length) return emptyView('pin','Some places<br>are worth keeping.','Save a spot by name and coordinates. No location permission, online map, or account required.','add-spot','Save your first spot');
      return `<div class="segmented" style="margin-top:16px" aria-label="Spot display"><button type="button" data-spot-view="list" aria-pressed="${spotView==='list'}">List</button><button type="button" data-spot-view="map" aria-pressed="${spotView==='map'}">Shoreline sketch</button></div>
        ${spotView==='map'?mapHTML():''}
        <div class="section-label"><span>Saved places</span><span>${data().spots.length} spots</span></div>
        ${data().spots.map(s=>`<button type="button" class="entry" data-spot="${escapeHTML(s.id)}"><span class="entry-art">${icon('pin')}</span><span class="entry-main"><strong>${escapeHTML(s.name)}</strong><small>${Number(s.lat).toFixed(4)}, ${Number(s.lon).toFixed(4)}</small><small>${s.sample?'Example · approximate coordinates':'Manually entered · unverified'}</small></span><span class="chevron" aria-hidden="true">›</span></button>`).join('')}
        <p class="footnote">Choose a spot, then swipe between your saved piers. Conditions are synthetic Phase 2 previews, not live data. Check access and posted restrictions independently.</p>`;
    }
    const spotOptions = (selected, includeEmpty) => `${includeEmpty?'<option value="">No saved spot</option>':''}${data().spots.map(s=>`<option value="${escapeHTML(s.id)}" ${s.id===selected?'selected':''}>${escapeHTML(s.name)}</option>`).join('')}`;
    function conditionsHTML(spot) {
      const banner = '<div class="phase-banner"><strong>Phase 2 / Sample only</strong>Nothing here is live. All weather and tide values below are synthetic.</div>';
      return `${banner}
        <section class="weather" aria-label="Synthetic weather preview for ${escapeHTML(spot.name)}">
          <div class="weather-head"><div><span class="temperature">68°</span><span>F</span></div>${icon('weather')}</div>
          <p>Partly cloudy · synthetic weather</p>
          <p>Sample: June 14, 2026 · 8:00 AM EDT</p>
          <dl><div><dt>Wind</dt><dd>SW · 8 mph</dd></div><div><dt>Gusts</dt><dd>13 mph</dd></div><div><dt>Precipitation chance</dt><dd>10%</dd></div></dl>
        </section>
        <h3>Tides · synthetic example</h3>
        <p class="help">Day’s range: 0.3–4.9 ft MLLW · sample only</p>
        <svg class="tide-chart" viewBox="0 0 320 90" role="img" aria-label="Synthetic tide curve: high 4.6 feet at 2:10 AM, low 0.3 at 8:30 AM, high 4.9 at 2:45 PM, low 0.5 at 9 PM. Schematic, not for navigation.">
          <path d="M0 72h320" stroke="#d8dcd1" stroke-dasharray="3 4"/>
          <path d="M0 43Q14 9 29 15C60 15 84 70 113 70S166 11 197 11 249 68 280 68Q302 68 320 43" stroke="currentColor" fill="none" stroke-width="2"/>
          <g fill="currentColor"><circle cx="29" cy="15" r="3"/><circle cx="113" cy="70" r="3"/><circle cx="197" cy="11" r="3"/><circle cx="280" cy="68" r="3"/></g>
        </svg>
        <details class="source-details"><summary>Tide table & sample sources</summary>
        <p>Same synthetic scenario for every spot. No coordinate-based lookup.</p>
        <p>The Battery · station 8518750. Illustrative station reference; mapping to this spot is not verified. Not a NOAA prediction.</p>
        <table><caption class="help" style="text-align:left;margin-bottom:6px">Synthetic high / low · June 14, 2026<br>Heights in ft MLLW · times in America/New_York (EDT)</caption><thead><tr><th scope="col">Event</th><th scope="col">Time</th><th scope="col">ft MLLW</th></tr></thead><tbody><tr><td>High</td><td>2:10 AM</td><td>4.6</td></tr><tr><td>Low</td><td>8:30 AM</td><td>0.3</td></tr><tr><td>High</td><td>2:45 PM</td><td>4.9</td></tr><tr><td>Low</td><td>9:00 PM</td><td>0.5</td></tr></tbody></table>
        <p class="footnote"><strong>Attribution placeholder.</strong> No WeatherKit data is used here. Phase 2 must display the actual Apple Weather attribution and required legal link supplied by WeatherKit. Real NOAA source attribution and station selection also remain to be implemented.</p>
        <p class="footnote">Water level is not a current prediction. This study does not assess safety or predict fishing success.</p></details>`;
    }
    function spotDetailHTML(spot) {
      const catches = data().catches.filter(c=>c.spotId===spot.id);
      return `${conditionsHTML(spot)}
        <section class="spot-notes" aria-labelledby="spot-notes-${spot.id}">
          <h3 id="spot-notes-${spot.id}">Your spot · local journal</h3>
          <p class="help">${spot.sample?'Example location · not endorsed':'Manually entered · unverified'}</p>
          ${detailList([['Coordinates (latitude, longitude)',`${spot.lat}, ${spot.lon}`],['Personal notes',spot.notes]])}
          <p class="footnote">Coordinates do not establish access or permission to fish. Verify rules independently.</p>
        </section>
        <section aria-labelledby="linked-catches-${spot.id}">
          <h3 id="linked-catches-${spot.id}" data-catches-heading tabindex="-1">Catches here · ${catches.length}</h3>
          ${catches.length?catchRows(catches):'<p class="help">No catches linked to this spot yet. Your next entry can start here.</p>'}
          <div class="sheet-actions"><button type="button" class="primary full" data-action="log-here">Log a catch here</button></div>
          <p class="footnote">Catch times use your device’s local timezone. Example sizes do not imply legal retention.</p>
        </section>`;
    }
    function syncActiveSpot(id) {
      const spot=data().spots.find(s=>s.id===id);
      if (!spot) return;
      const oldPage=activeContent();
      if (oldPage?.contains(document.activeElement) && openSpotId!==id) $('#screen-title').focus({preventScroll:true});
      openSpotId=id;lastSpots[mode]=id;
      $('#screen-title').textContent=spot.name;
      const index=data().spots.indexOf(spot);
      $('#previous-spot').disabled=index===0;
      $('#next-spot').disabled=index===data().spots.length-1;
      $('#spot-position').textContent=`${spot.name}, spot ${index+1} of ${data().spots.length}`;
      document.querySelectorAll('[data-go-spot]').forEach(button=>button.setAttribute('aria-current',String(button.dataset.goSpot===id)));
      const count=$('#spot-dots .page-count');
      if (count) count.textContent=`${index+1} of ${data().spots.length}`;
      document.querySelectorAll('[data-page-spot]').forEach(page=>{
        const active=page.dataset.pageSpot===id;
        page.inert=!active;page.setAttribute('aria-hidden',String(!active));
      });
      updateInspector();
    }
    function goToSpot(id) {
      const rail=$('#spot-pages'),index=data().spots.findIndex(s=>s.id===id);
      if (!rail || index<0) return;
      rail.scrollTo({left:index*rail.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
    function mountSpotPages() {
      const rail=$('#spot-pages');
      if (!rail) return;
      let width=rail.clientWidth;
      const align=()=>rail.scrollTo({left:data().spots.findIndex(s=>s.id===openSpotId)*width,behavior:'instant'});
      syncActiveSpot(openSpotId);align();
      rail.addEventListener('scroll',()=>{
        if (rail!==$('#spot-pages') || rail.clientWidth!==width || !width) return;
        const index=Math.max(0,Math.min(data().spots.length-1,Math.round(rail.scrollLeft/width)));
        if (data().spots[index].id!==openSpotId) syncActiveSpot(data().spots[index].id);
      });
      rail.addEventListener('keydown',event=>{
        if (!event.target.matches('.spot-page')) return;
        if (event.key!=='ArrowLeft' && event.key!=='ArrowRight') return;
        event.preventDefault();
        const index=data().spots.findIndex(s=>s.id===openSpotId)+(event.key==='ArrowRight'?1:-1);
        if (data().spots[index]) goToSpot(data().spots[index].id);
      });
      pageResizeObserver=new ResizeObserver(()=>{
        if (rail.clientWidth!==width) {width=rail.clientWidth;align();}
      });
      pageResizeObserver.observe(rail);
    }
    function render() {
      pageResizeObserver?.disconnect();
      const spot = tab==='spots' ? data().spots.find(s=>s.id===openSpotId) : null;
      if (!spot) openSpotId='';
      $('.app-header').classList.toggle('spot-open',Boolean(spot));
      $('#back-spots').hidden = !spot;
      $('#toolbar-log').hidden = !spot;
      $('#spot-more').hidden = !spot;
      $('#screen-title').textContent = spot ? spot.name : {journal:'Journal',spots:'All spots'}[tab];
      $('#screen-note').textContent = spot?'Conditions · Phase 2 / Sample only':mode==='sample'?'Includes example data · in-memory demo':'First-use view · in-memory demo';
      $('#add-button').hidden = Boolean(spot);
      $('#add-button').style.display = spot?'none':'grid';
      $('#add-button').setAttribute('aria-label',tab==='spots'?'Add spot':'Add catch');
      document.querySelectorAll('[data-tab]').forEach(button=>{
        const active = button.dataset.tab===tab;
        button.setAttribute('aria-selected',String(active)); button.tabIndex=active?0:-1;
      });
      document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
      $('#panel').setAttribute('aria-labelledby',spot?'tab-spots screen-title':`tab-${tab}`);
      $('#panel').classList.toggle('paging',Boolean(spot));
      $('#spot-paging').hidden=!spot || data().spots.length<2;
      $('#spot-dots').innerHTML=spot && data().spots.length<=3
        ? data().spots.map(s=>`<button type="button" data-go-spot="${s.id}" aria-label="Go to ${escapeHTML(s.name)}" aria-current="${s.id===spot.id}"></button>`).join('')
        : '<span class="page-count"></span>';
      $('#panel').innerHTML = tab==='journal'?journalHTML():spot
        ? `<div class="spot-pages" id="spot-pages">${data().spots.map(s=>`<section class="spot-page" data-page-spot="${s.id}" role="group" aria-roledescription="spot page" aria-label="${escapeHTML(s.name)}" tabindex="0">${spotDetailHTML(s)}</section>`).join('')}</div>`
        : spotsHTML();
      mountSpotPages();
      updateInspector();
    }
    function setTab(next) { tab=next; openSpotId=next==='spots'?(rememberedSpot()?.id || ''):''; spotsScroll=0; render(); $('#panel').scrollTop=0; }
    function backToSpots() {
      const id=openSpotId;
      openSpotId='';render();
      const target=$(`[data-spot="${id}"]`) || $('#add-button');
      target.focus({preventScroll:true});
      $('#panel').scrollTop=spotsScroll;
    }
    $('#back-spots').onclick=backToSpots;
    $('#previous-spot').onclick=()=>{
      const index=data().spots.findIndex(s=>s.id===openSpotId);
      if (index>0) goToSpot(data().spots[index-1].id);
    };
    $('#next-spot').onclick=()=>{
      const index=data().spots.findIndex(s=>s.id===openSpotId);
      if (index<data().spots.length-1) goToSpot(data().spots[index+1].id);
    };
    $('#spot-dots').onclick=event=>{
      const button=event.target.closest('[data-go-spot]');
      if (button) goToSpot(button.dataset.goSpot);
    };
    const sheet = $('#sheet');
    function updateInspector() {
      let title=tab==='journal'?'TabView → NavigationStack → List':'TabView → NavigationStack → List / map';
      let phase='Phase 1 · local journal and spots';
      let boundary='In-memory demo only; native on-device persistence is not implemented.';
      if (openSpotId) {
        title='NavigationStack → page-style TabView → spot sections';
        phase='Phase 1 journal · Phase 2 embedded conditions';
        boundary='Swipe selection remembers each demo view’s last spot. Weather and tides are synthetic; no provider access.';
      }
      if (sheetContext) {
        title=sheetContext;
        phase=formSession?.kind==='catch'?'Phase 1a · photo-first catch logging':formSession?.kind==='spot'?'Phase 1 spot form · Phase 1b location preview':'Phase 1 · local actions';
        boundary='Native sheet / Form / confirmationDialog planned. Draft changes commit only with Save.';
        if (sheetContext.includes('PhotosPicker') || sheetContext.includes('Camera') || sheetContext.includes('Photo review')) {phase='Phase 1a · review simulation';boundary='Capture or select → review → details → Save. Original fish illustrations only; no camera, photo-library, or file access. Skip always remains available.';}
        if (sheetContext.includes('Map') || sheetContext.includes('Core Location')) {phase='Phase 1b · review simulation';boundary='Fixed sample pins, never a location lookup. Future Core Location must handle denied and reduced-accuracy access; manual coordinates remain available.';}
      }
      $('#inspector-title').textContent=title;
      $('#inspector-phase').textContent=phase;
      $('#inspector-boundary').textContent=boundary;
      $('#permission-status').textContent=`Location simulation (${mode==='sample'?'Sample':'First-use'} view): ${locationPermissions[mode]}`;
      $('#camera-permission-status').textContent=`Camera simulation (${mode==='sample'?'Sample':'First-use'} view): ${cameraPermissions[mode]}`;
    }
    function openSheet(title, body, options={}) {
      if (typeof sheet.showModal!=='function') { announce('This browser cannot display native dialog previews. Use a current browser; no changes were saved.'); return false; }
      if (!sheet.open) returnFocus = document.activeElement;
      cancelSheet=options.cancel || closeSheet;
      sheetContext=options.context || 'NavigationStack → sheet';
      sheet.setAttribute('role',options.confirm?'alertdialog':'dialog');
      sheet.innerHTML = `<div class="sheet-head"><button type="button" data-close>${options.closeLabel || 'Cancel'}</button><h2 id="sheet-title">${escapeHTML(title)}</h2>${options.form?`<button type="submit" form="${options.form}" data-sheet-save>Save</button>`:''}</div><div class="sheet-body">${body}</div>`;
      if (!sheet.open) sheet.showModal();
      document.querySelectorAll('[data-mode], #reset-demo, #reset-permission, #reset-camera-permission').forEach(button=>button.disabled=true);
      const target = sheet.querySelector('[autofocus]') || sheet.querySelector('[data-close]');
      target.focus();
      sheet.scrollTop=0;
      updateInspector();
      return true;
    }
    function closeSheet() { formSession=null;cancelSheet=null;sheetContext='';sheet.close(); }
    sheet.addEventListener('close',()=>{
      formSession=null;cancelSheet=null;sheetContext='';
      document.querySelectorAll('[data-mode], #reset-demo, #reset-permission, #reset-camera-permission').forEach(button=>button.disabled=false);
      updateInspector();
      if (returnFocus?.isConnected && !returnFocus.hidden && !returnFocus.closest('[inert]')) returnFocus.focus();
      else {
        const row=returnFocus?.dataset.catch ? activeContent()?.querySelector(`[data-catch="${returnFocus.dataset.catch}"]`) : null;
        (row || (openSpotId ? activeContent().querySelector('[data-catches-heading]') : $(`#tab-${tab}`))).focus();
      }
    });
    sheet.addEventListener('cancel',event=>{event.preventDefault();cancelSheet?.();});
    sheet.addEventListener('click',event=>{if(event.target.closest('[data-close]'))cancelSheet?.();});
    function captureDraft() {
      if (!formSession) return;
      const form=$(`#${formSession.kind}-form`);
      if (form) Object.assign(formSession.values,Object.fromEntries(new FormData(form)));
    }
    function beginForm(kind, existing, values) {
      formSession={kind,id:existing?.id || '',original:existing?{...existing}:null,mode,originSpotId:openSpotId,values:{...values},initial:JSON.stringify(values),committed:false};
      if (kind==='catch' && !existing) startPhotoFlow(true);
      else renderForm();
    }
    function cancelForm(resume=renderForm) {
      captureDraft();
      if (!formSession || (JSON.stringify(formSession.values)===formSession.initial && !formSession.photoFlow?.pending)) {closeSheet();return;}
      openSheet('Discard changes?',`<p>Your unsaved ${formSession.kind==='catch'?'catch':'spot'} changes, including any new image, will be lost. Saved entries will not change.</p><div class="sheet-actions"><button type="button" class="secondary" id="keep-editing" autofocus>Keep editing</button><button type="button" class="primary danger-fill" id="discard-draft">Discard</button></div>`,{confirm:true,cancel:resume,closeLabel:'Keep editing',context:'Form → confirmationDialog · unsaved changes'});
      $('#keep-editing').onclick=resume;
      $('#discard-draft').onclick=closeSheet;
    }
    function returnToForm(focusSelector) {
      renderForm();
      if (focusSelector) $(focusSelector)?.focus();
    }
    function catchForm(spotId='', existing=null) {
      const c = existing || {species:'',date:nowLocal(),spotId,length:'',bait:'',notes:''};
      const missingSpot=Boolean(c.spotName && !data().spots.some(s=>s.id===c.spotId));
      beginForm('catch',existing,{species:c.species,date:c.date,spotId:missingSpot?'__previous':c.spotId,length:c.length,bait:c.bait,notes:c.notes,photoFixture:c.photoFixture || ''});
    }
    function spotForm(existing=null) {
      beginForm('spot',existing,{name:existing?.name || '',lat:existing?String(existing.lat):'',lon:existing?String(existing.lon):'',notes:existing?.notes || ''});
    }
    function renderForm() {
      if (!formSession) return;
      const session=formSession, v=session.values, catchMode=session.kind==='catch';
      const title=session.id?(catchMode?'Edit catch':'Edit spot'):(catchMode?'Catch details':'Add spot');
      const row=(label,input)=>`<div class="form-row">${label}${input}</div>`;
      let fields;
      if (catchMode) {
        const historical=session.original?.spotName && !data().spots.some(s=>s.id===session.original.spotId);
        fields=`<fieldset class="form-group photo-first"><legend>Photo · Phase 1a</legend>
          ${v.photoFixture?photoHTML(v.photoFixture):'<p class="help">No photo attached. You can still save this catch.</p>'}
          <button type="button" class="secondary full" id="choose-photo">${v.photoFixture?'Replace photo':'Add a photo'}</button>
          ${v.photoFixture?'<button type="button" class="danger full" id="remove-photo">Remove photo</button>':''}
          <p class="help">Image simulation only. No camera or library access.</p></fieldset>
          <fieldset class="form-group"><legend>Catch · Phase 1</legend>
          ${row('<label for="species">Species *</label>',`<input id="species" name="species" required maxlength="80" value="${escapeHTML(v.species)}" autofocus>`)}
          ${row('<label for="catch-date">Date & time *</label>',`<input type="datetime-local" id="catch-date" name="date" required value="${escapeHTML(v.date)}" aria-describedby="date-help">`)}
          <p class="help" id="date-help">Device-local time.</p>
          ${row('<label for="catch-spot">Spot</label>',`<select id="catch-spot" name="spotId">${historical?`<option value="__previous" ${v.spotId==='__previous'?'selected':''}>${escapeHTML(session.original.spotName)} (removed spot)</option>`:''}${spotOptions(v.spotId,true)}</select>`)}
          </fieldset>
          <fieldset class="form-group"><legend>Details · optional</legend>
          ${row('<label for="catch-length">Length (in)</label>',`<input type="number" inputmode="decimal" id="catch-length" name="length" min="0.1" step="any" value="${escapeHTML(v.length)}">`)}
          ${row('<label for="bait">Bait / lure</label>',`<input id="bait" name="bait" maxlength="120" value="${escapeHTML(v.bait)}">`)}
          ${row('<label for="catch-notes">Notes</label>',`<textarea id="catch-notes" name="notes" maxlength="2000">${escapeHTML(v.notes)}</textarea>`)}
          </fieldset>`;
      } else {
        fields=`<fieldset class="form-group"><legend>Spot · Phase 1</legend>
          ${row('<label for="spot-name">Name *</label>',`<input id="spot-name" name="name" required maxlength="100" value="${escapeHTML(v.name)}" autofocus>`)}
          ${row('<label for="spot-notes">Notes</label>',`<textarea id="spot-notes" name="notes" maxlength="2000">${escapeHTML(v.notes)}</textarea>`)}
          </fieldset>
          <fieldset class="form-group"><legend>Location · Phase 1b preview</legend>
          <p class="help">Choose a fixed sample pin, simulate a permission result, or enter coordinates manually. No real location is requested.</p>
          <div class="choice-list"><button type="button" id="choose-map">Choose on illustrative map ›</button><button type="button" id="use-location">Use current location · simulation ›</button></div>
          ${row('<label for="latitude">Latitude *</label>',`<input id="latitude" name="lat" inputmode="text" required value="${escapeHTML(v.lat)}" aria-describedby="lat-help">`)}
          <p class="help" id="lat-help">Decimal degrees, −90 to 90.</p>
          ${row('<label for="longitude">Longitude *</label>',`<input id="longitude" name="lon" inputmode="text" required value="${escapeHTML(v.lon)}" aria-describedby="lon-help">`)}
          <p class="help" id="lon-help">Decimal degrees, −180 to 180. West is negative. Coordinates are unverified.</p>
          </fieldset>`;
      }
      if (!openSheet(title,`<form id="${session.kind}-form"><p class="help">In-memory preview only. * Required; all other fields optional.</p>${fields}</form>`,{form:`${session.kind}-form`,cancel:cancelForm,context:'NavigationStack → sheet → grouped Form'})) {formSession=null;return;}
      const form=$(`#${session.kind}-form`);
      form.addEventListener('input',event=>event.target.setCustomValidity?.(''));
      form.addEventListener('submit',event=>{event.preventDefault();saveForm(session);});
      if (catchMode) {
        $('#choose-photo').onclick=()=>{captureDraft();startPhotoFlow(false);};
        if ($('#remove-photo')) $('#remove-photo').onclick=()=>{captureDraft();formSession.values.photoFixture='';returnToForm('#choose-photo');};
      } else {
        $('#choose-map').onclick=()=>{captureDraft();mapPicker();};
        $('#use-location').onclick=()=>{captureDraft();locationSimulation();};
      }
    }
    function invalidField(selector,message) {
      const field=$(selector);field.setCustomValidity(message);field.reportValidity();field.focus();
      return false;
    }
    function saveForm(session) {
      if (session!==formSession || session.committed || session.mode!==mode) return;
      captureDraft();
      const v=session.values, form=$(`#${session.kind}-form`);
      if (!form.reportValidity()) return;
      if (session.kind==='catch') {
        if (!v.species.trim()) return invalidField('#species','Enter a species name.');
        if (!Number.isFinite(new Date(v.date).getTime())) return invalidField('#catch-date','Enter a valid date and time.');
        if (v.length && (!Number.isFinite(Number(v.length)) || Number(v.length)<0.1)) return invalidField('#catch-length','Enter a length of at least 0.1 inches, or leave it empty.');
      } else {
        if (!v.name.trim()) return invalidField('#spot-name','Enter a spot name.');
        for (const [key,limit,id] of [['lat',90,'latitude'],['lon',180,'longitude']]) {
          if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(v[key].trim()) || !Number.isFinite(Number(v[key])) || Math.abs(Number(v[key]))>limit) return invalidField(`#${id}`,`Enter decimal degrees from −${limit} to ${limit}.`);
        }
      }
      session.committed=true;
      if (session.kind==='catch') {
        const spot=data().spots.find(s=>s.id===v.spotId),original=session.original;
        const preserveName=original && (v.spotId==='__previous' || (spot && original.spotId===spot.id));
        const entry={id:session.id || newId(),species:v.species.trim(),date:v.date,spotId:spot?.id || '',spotName:preserveName?original.spotName:(spot?.name || ''),length:v.length,bait:v.bait.trim(),notes:v.notes.trim(),photoFixture:photoFixtures[v.photoFixture]?v.photoFixture:'',sample:original?.sample || false};
        if (session.id) data().catches[data().catches.findIndex(c=>c.id===session.id)]=entry;
        else data().catches.push(entry);
        if (session.originSpotId && data().spots.some(s=>s.id===session.originSpotId)) {
          tab='spots';openSpotId=session.originSpotId;render();
          returnFocus=activeContent().querySelector(`[data-catch="${entry.id}"]`) || activeContent().querySelector('[data-catches-heading]');
        } else {setTab('journal');returnFocus=$(`[data-catch="${entry.id}"]`);}
        closeSheet();announce(`${entry.species} saved in this view. Changes reset on reload.`);
      } else {
        const spot={id:session.id || newId(),name:v.name.trim(),lat:Number(v.lat),lon:Number(v.lon),notes:v.notes.trim(),sample:session.original?.sample || false};
        if (session.id) data().spots[data().spots.findIndex(s=>s.id===session.id)]=spot;
        else data().spots.push(spot);
        lastSpots[mode]=spot.id;setTab('spots');returnFocus=$('#screen-title');
        closeSheet();announce(`${spot.name} saved. Existing catches keep their historical spot names.`);
      }
    }
    function startPhotoFlow(isNew) {
      formSession.photoFlow={isNew,screen:'camera',source:'camera',pending:''};
      cameraCapture();
    }
    function resumePhotoFlow() {
      const screen=formSession.photoFlow.screen;
      if (screen==='review') photoReview();
      else if (screen==='library') photoPicker();
      else cameraCapture();
    }
    function cancelPhotoFlow() {
      if (formSession.photoFlow.isNew) cancelForm(resumePhotoFlow);
      else {formSession.photoFlow=null;returnToForm('#choose-photo');}
    }
    function cameraCapture() {
      const flow=formSession.photoFlow,permission=cameraPermissions[mode];
      flow.screen='camera';
      const allowed=permission==='allowed',denied=permission==='denied';
      const preview=allowed
        ? `<div class="camera-viewfinder">${photoHTML('bass')}<span class="viewfinder-label">Simulated viewfinder · no live camera</span></div>`
        : `<div class="camera-placeholder">${icon('camera')}<strong>${denied?'Camera access denied':'Capture the fish first'}</strong><p>${denied?'Choose a photo or continue without one.':'In the native app, the camera opens here after permission.'}</p></div>`;
      const controls=allowed
        ? '<button type="button" class="shutter-button" id="capture-photo"><span class="shutter-ring" aria-hidden="true"></span>Capture sample photo</button>'
        : denied
          ? '<p class="help">This simulated denial is remembered. Native recovery uses app Settings; no repeated permission prompt. The exterior review control resets the demo only.</p>'
          : '<div class="choice-list"><button type="button" id="allow-camera">Allow demo camera</button><button type="button" id="deny-camera">Deny camera access · demo</button></div>';
      openSheet(flow.isNew?'Capture your catch':'Replace photo',`<p class="capture-phase">Phase 1a / REVIEW SIMULATION · no device access</p>${preview}${controls}
        <div class="photo-alternatives"><button type="button" class="secondary full" id="photo-library">Choose from Photos</button><button type="button" class="full" id="skip-photo">${flow.isNew?'Skip photo':'Keep existing photo'}</button></div>`,{cancel:cancelPhotoFlow,context:'Camera → capture-first catch entry'});
      if ($('#allow-camera')) $('#allow-camera').onclick=()=>{cameraPermissions[mode]='allowed';cameraCapture();};
      if ($('#deny-camera')) $('#deny-camera').onclick=()=>{cameraPermissions[mode]='denied';cameraCapture();};
      if ($('#capture-photo')) $('#capture-photo').onclick=()=>{flow.pending='bass';flow.source='camera';photoReview();};
      $('#photo-library').onclick=photoPicker;
      $('#skip-photo').onclick=()=>{formSession.photoFlow=null;returnToForm('#choose-photo');};
    }
    function photoPicker() {
      const flow=formSession.photoFlow;flow.screen='library';
      openSheet('Choose from Photos',`<p class="capability-note"><strong>Phase 1a / REVIEW SIMULATION</strong>Native PhotosPicker is planned. These are original fish illustrations, not your photo library. No species recognition or metadata extraction occurs.</p>
        ${Object.entries(photoFixtures).map(([id,name])=>`${photoHTML(id)}<button type="button" class="secondary full" data-photo="${id}">Choose sample ${name}</button>`).join('')}`,{
        cancel:()=>{if(flow.isNew)cameraCapture();else cancelPhotoFlow();},
        context:'PhotosPicker → photo-first catch entry'});
      sheet.querySelectorAll('[data-photo]').forEach(button=>button.onclick=()=>{flow.pending=button.dataset.photo;flow.source='library';photoReview();});
    }
    function photoReview() {
      const flow=formSession.photoFlow;flow.screen='review';
      openSheet('Review photo',`<p class="capture-phase">Phase 1a / REVIEW SIMULATION · not a real photo</p>${photoHTML(flow.pending)}
        <p class="help">Nothing is saved yet. Use this image, then add the catch details.</p>
        <div class="sheet-actions"><button type="button" class="secondary" id="retake-photo">${flow.source==='camera'?'Retake':'Choose different'}</button><button type="button" class="primary" id="use-photo">Use photo</button></div>`,{cancel:cancelPhotoFlow,context:'Photo review → use image → catch details'});
      $('#retake-photo').onclick=()=>{flow.pending='';if(flow.source==='camera')cameraCapture();else photoPicker();};
      $('#use-photo').onclick=()=>{formSession.values.photoFixture=flow.pending;formSession.photoFlow=null;renderForm();};
    }
    function mapPicker() {
      openSheet('Choose sample pin',`<p class="capability-note"><strong>Phase 1b / REVIEW SIMULATION</strong>Illustrative map — not for navigation. Fixed sample choices only; no geocoding, map lookup, or access verification.</p>
        <svg class="map" viewBox="0 0 320 180" role="img" aria-label="Schematic shoreline with two numbered sample pin choices, not geographically precise"><path fill="#b6c8ae" d="M190 0h130v180H240l-20-65-40-45Z"/><path d="m192 71-55 20m82 31-55 23" stroke="#607d62" stroke-width="12"/><g fill="#24634d"><circle cx="147" cy="81" r="15"/><circle cx="178" cy="137" r="15"/></g><g fill="#fff" font-family="sans-serif" font-size="15" text-anchor="middle"><text x="147" y="86">1</text><text x="178" y="142">2</text></g></svg>
        <div class="choice-list">${initial().spots.map((s,i)=>`<button type="button" data-map-pin="${i}">${i+1}. ${s.name}<br>Sample: ${s.lat}, ${s.lon}</button>`).join('')}</div><p class="help">Cancel returns to your unchanged draft. Manual latitude and longitude fields are always available there.</p>`,{cancel:()=>returnToForm('#choose-map'),context:'Map selection → fixed sample pin'});
      sheet.querySelectorAll('[data-map-pin]').forEach(button=>button.onclick=()=>{
        const sample=initial().spots[Number(button.dataset.mapPin)];
        formSession.values.lat=String(sample.lat);formSession.values.lon=String(sample.lon);
        returnToForm('#latitude');
      });
    }
    function locationSimulation() {
      const permission=locationPermissions[mode], denied=permission==='denied';
      openSheet('Location simulation',`<p class="capability-note"><strong>Phase 1b / REVIEW SIMULATION</strong>No browser permission or location API is called. This is not your current location.</p>
        <p class="help">Fixed location fixture: Pier 4, Brooklyn · 40.6945, −73.9994. Approximate sample coordinates, not an actual fix.</p>
        <p>${denied?'Simulated access is denied. We will not prompt again. In the future native app, explain how to change Location access in Settings; manual entry remains available.':permission==='allowed'?'Sample access was previously allowed in this view. You can reuse the fixed fixture below.':'Review the first permission request by choosing an outcome.'}</p>
        <div class="choice-list">${denied?'':`<button type="button" id="allow-location">${permission==='allowed'?'Use allowed sample location':'Allow sample location'}</button>${permission==='allowed'?'':'<button type="button" id="deny-location">Deny</button>'}`}
        <button type="button" id="manual-location">Enter coordinates manually</button><button type="button" id="location-map">Choose sample map pin</button></div>
        <p class="help">Native handoff: reduced accuracy must be disclosed and confirmed, not represented as an exact fix. These fixed sample coordinates do not model actual accuracy. Reset simulation using the exterior control after closing this form.</p>`,{cancel:()=>returnToForm('#use-location'),context:'Core Location → permission review simulation'});
      if ($('#allow-location')) $('#allow-location').onclick=()=>{
        locationPermissions[mode]='allowed';
        const sample=initial().spots[0];formSession.values.lat=String(sample.lat);formSession.values.lon=String(sample.lon);
        returnToForm('#latitude');
      };
      if ($('#deny-location')) $('#deny-location').onclick=()=>{locationPermissions[mode]='denied';locationSimulation();};
      $('#manual-location').onclick=()=>returnToForm('#latitude');
      $('#location-map').onclick=mapPicker;
    }
    const detailList = (pairs) => `<dl class="details">${pairs.map(([key,value])=>`<div><dt>${escapeHTML(key)}</dt><dd>${escapeHTML(value || 'Not recorded')}</dd></div>`).join('')}</dl>`;
    function confirmAction(title,text,callback,back,label) {
      openSheet(title,`<p>${escapeHTML(text)}</p><div class="sheet-actions"><button type="button" id="keep" class="secondary" autofocus>Cancel</button><button type="button" id="confirm-delete" class="primary danger-fill">${label}</button></div>`,{cancel:back,confirm:true,context:'confirmationDialog → destructive action'});
      $('#keep').onclick=back;
      let confirmed=false;
      $('#confirm-delete').onclick=()=>{if(confirmed)return;confirmed=true;callback();};
    }
    function catchDetail(id) {
      const c=data().catches.find(item=>item.id===id);if(!c)return;
      openSheet('Catch details',`<h3 class="detail-heading">${escapeHTML(c.species)}</h3><p>${c.sample?'Sample catch':'Your demo entry'} · not permanently saved</p>${photoHTML(c.photoFixture)}
        ${detailList([['Date & time (device-local)',dateLabel(c.date,{dateStyle:'medium',timeStyle:'short'})],['Spot',c.spotName],['Length',c.length?`${c.length} inches`:''],['Bait / lure',c.bait],['Notes',c.notes]])}
        <div class="sheet-actions"><button type="button" class="secondary" id="edit-catch">Edit catch</button><button type="button" class="danger" id="delete-catch">Delete catch…</button></div>`,{closeLabel:'Done',context:'NavigationStack → catch detail sheet'});
      $('#edit-catch').onclick=()=>catchForm('',c);
      $('#delete-catch').onclick=()=>confirmAction('Delete this catch?',`Remove ${c.species} from this demo view? This cannot be undone without resetting the demo.`,()=>{data().catches=data().catches.filter(item=>item.id!==id);render();closeSheet();announce('Catch deleted from this view.');},()=>catchDetail(id),'Delete catch');
    }
    function spotDetail(id) {
      const s=data().spots.find(item=>item.id===id);if(!s)return;
      spotsScroll=$('#panel').scrollTop;
      tab='spots';openSpotId=id;render();$('#panel').scrollTop=0;
      $('#screen-title').focus({preventScroll:true});
    }
    function deleteOpenSpot(id=openSpotId) {
      const spot=data().spots.find(s=>s.id===id);if(!spot)return;
      const index=data().spots.indexOf(spot);
      confirmAction('Delete this spot?',`Remove ${spot.name}? Existing catches and their recorded spot names will be kept.`,()=>{
        data().spots=data().spots.filter(s=>s.id!==spot.id);
        data().catches.forEach(c=>{if(c.spotId===spot.id)c.spotId='';});
        const next=data().spots[Math.min(index,data().spots.length-1)];
        lastSpots[mode]=next?.id || '';
        setTab('spots');
        returnFocus=next ? $('#screen-title') : $('#add-button');
        closeSheet();announce('Spot deleted. Existing catches and their spot names were kept.');
      },closeSheet,'Delete spot');
    }
    function spotActions() {
      const id=openSpotId,spot=data().spots.find(s=>s.id===id);if(!spot)return;
      openSheet('Spot actions',`<p>${escapeHTML(spot.name)}</p><div class="choice-list"><button type="button" id="edit-spot">Edit spot</button><button type="button" class="danger" id="delete-spot">Delete spot…</button></div>`,{context:'Toolbar → Menu → spot actions'});
      $('#edit-spot').onclick=()=>spotForm(data().spots.find(s=>s.id===id));
      $('#delete-spot').onclick=()=>deleteOpenSpot(id);
    }
    $('#toolbar-log').onclick=()=>{if(openSpotId)catchForm(openSpotId);};
    $('#spot-more').onclick=spotActions;
    $('#add-button').onclick=()=>tab==='spots'?spotForm():catchForm();
    document.querySelectorAll('[data-tab]').forEach(button=>{
      button.onclick=()=>setTab(button.dataset.tab);
      button.onkeydown=event=>{
        const tabs=[...document.querySelectorAll('[data-tab]')],index=tabs.indexOf(button);
        let next;
        if(event.key==='ArrowRight')next=(index+1)%tabs.length;
        else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
        else if(event.key==='Home')next=0;
        else if(event.key==='End')next=tabs.length-1;
        else return;
        event.preventDefault();setTab(tabs[next].dataset.tab);tabs[next].focus();
      };
    });
    document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
      if (sheet.open) return;
      mode=button.dataset.mode;setTab(tab);
      announce(`${mode==='sample'?'Sample':'First-use'} view. Each view’s saved changes are kept separately until reload.`);
    });
    $('#panel').addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      const page=button.closest('[data-page-spot]');
      if (page && page.dataset.pageSpot!==openSpotId) syncActiveSpot(page.dataset.pageSpot);
      if(button.dataset.action==='add-catch')catchForm();
      if(button.dataset.action==='add-spot')spotForm();
      if(button.dataset.action==='log-here' && openSpotId)catchForm(openSpotId);
      if(button.dataset.action==='delete-spot')deleteOpenSpot();
      if(button.dataset.catch)catchDetail(button.dataset.catch);
      if(button.dataset.spot)spotDetail(button.dataset.spot);
      if(button.dataset.spotView){spotView=button.dataset.spotView;render();$(`[data-spot-view="${spotView}"]`).focus();}
    });
    $('#reset-demo').onclick=()=>{
      if (sheet.open) return;
      openSheet('Reset both demo views?',`<p>This discards all added catches, spots, edits, and simulated permissions in both views. The original sample entries return, and First-use view becomes empty again.</p><div class="sheet-actions"><button type="button" class="secondary" data-close autofocus>Cancel</button><button type="button" class="primary danger-fill" id="confirm-reset">Reset demo</button></div>`,{confirm:true,context:'confirmationDialog → reset review data'});
      $('#confirm-reset').onclick=()=>{stores={sample:initial(),first:{spots:[],catches:[]}};lastSpots={sample:'',first:''};locationPermissions={sample:'not requested',first:'not requested'};cameraPermissions={sample:'not requested',first:'not requested'};spotView='list';setTab('journal');closeSheet();announce('Both views and permission simulations reset. Original sample entries restored; First-use view is empty.');};
    };
    $('#reset-permission').onclick=()=>{
      if (sheet.open) return;
      locationPermissions[mode]='not requested';updateInspector();announce('Location simulation reset for this view. No actual permission was changed.');
    };
    $('#reset-camera-permission').onclick=()=>{
      if (sheet.open) return;
      cameraPermissions[mode]='not requested';updateInspector();announce('Camera simulation reset for this view. No actual permission was changed.');
    };
    const missingAPIs=[];
    if (typeof sheet.showModal!=='function') missingAPIs.push('dialog');
    if (typeof ResizeObserver==='undefined') missingAPIs.push('ResizeObserver');
    if (typeof HTMLElement==='undefined' || !('inert' in HTMLElement.prototype)) missingAPIs.push('inert');
    if (typeof $('#panel').scrollTo!=='function') missingAPIs.push('element scrolling');
    if (typeof matchMedia!=='function') missingAPIs.push('media queries');
    if (missingAPIs.length) {
      $('#panel').innerHTML=`<p class="capability-note">This browser lacks required preview support: ${missingAPIs.join(', ')}. Open in a current browser. No capabilities were simulated or data saved.</p>`;
      document.querySelectorAll('.phone button, .review-controls button').forEach(button=>button.disabled=true);
      $('#inspector-title').textContent='Browser support required';
      $('#inspector-boundary').textContent='Interactive preview unavailable; no success fallback is shown.';
    } else render();
