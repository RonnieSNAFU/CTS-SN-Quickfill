(function() {
    if (window.snuHasInjected) {
        return;
    }
    window.snuHasInjected = true;

    // A utility to wait for an element to exist before running a callback.
    const waitForElement = (selector, context, callback, elementDescription = selector, suppressTimeoutWarning = false) => {
        let retries = 0;
        const MAX_RETRIES = 40; // Approx 20 seconds timeout (40 * 500ms)
        const interval = setInterval(() => {
            const element = context.querySelector(selector);
            if (element) {
                clearInterval(interval);
                callback(element);
            } else if (++retries > MAX_RETRIES) {
                clearInterval(interval);
                if (!suppressTimeoutWarning) { // Only warn if not suppressed
                    console.warn(`SN QuickFill: Element "${elementDescription}" (selector: ${selector}) not found after ${retries} retries.`);
                }
            }
        }, 500);
    };

    // The main setup function. It will be called only once the page is ready.
    const main = () => {
        let isApplyingDefaults = false; // Flag to prevent auto-open during form fill
        let modalWasManuallyClosed = false; // Flag to prevent re-open after manual X close

        const MODAL_HTML = `
            <div id="snu-modal-container" style="display: none;">
                <div id="snu-modal-content">
                    <div class="snu-top-controls"><label class="snu-switch" title="Auto-open on new incident page load"><input type="checkbox" id="snu-auto-open-toggle"><span class="snu-slider round"></span></label><span class="snu-switch-label">Auto-Open on New</span></div>
                    <button id="snu-close-btn">&times;</button>
                    <div class="snu-header"><h2>CTS SN Quickfill</h2><p class="snu-subtitle">Created by Ronnie Aishman</p></div>
                    <div id="snu-two-column-layout">
                        <div class="snu-column">
                            <div class="field-group"><label for="category-input">Category</label><select id="category-input" data-field="category"></select><button data-field="category" class="default-btn">Set as Default</button></div>
                            <div class="field-group"><label for="channel-input">Channel</label><select id="channel-input" data-field="channel"></select><button data-field="channel" class="default-btn">Set as Default</button></div>
                            <div class="field-group"><label for="state-input">State</label><select id="state-input" data-field="state"></select><button data-field="state" class="default-btn">Set as Default</button></div>
                        </div>
                        <div class="snu-column">
                            <div class="field-group"><label for="caller-input">Caller</label><div class="custom-dropdown-container"><div class="input-wrapper"><input type="text" id="caller-input" data-field="caller" class="custom-dropdown-input" placeholder="Type or select a caller..." autocomplete="off"><button class="dropdown-arrow" data-field="caller">&#9660;</button></div><div class="dropdown-panel" id="caller-panel"></div></div><div class="button-row"><button data-field="caller" class="plus-btn" title="Save this entry">+</button><button data-field="caller" class="default-btn">Set as Default</button></div></div>
                            <div class="field-group"><label for="config-item-input">Configuration Item</label><div class="custom-dropdown-container"><div class="input-wrapper"><input type="text" id="config-item-input" data-field="configurationItem" class="custom-dropdown-input" placeholder="Type or select an item..." autocomplete="off"><button class="dropdown-arrow" data-field="configurationItem">&#9660;</button></div><div class="dropdown-panel" id="config-item-panel"></div></div><div class="button-row"><button data-field="configurationItem" class="plus-btn" title="Save this entry">+</button><button data-field="configurationItem" class="default-btn">Set as Default</button></div></div>
                            <div class="field-group"><label for="assignment-group-input">Assignment Group</label><div class="custom-dropdown-container"><div class="input-wrapper"><input type="text" id="assignment-group-input" data-field="assignmentGroup" class="custom-dropdown-input" placeholder="Type or select a group..." autocomplete="off"><button class="dropdown-arrow" data-field="assignmentGroup">&#9660;</button></div><div class="dropdown-panel" id="assignment-group-panel"></div></div><div class="button-row"><button data-field="assignmentGroup" class="plus-btn" title="Save this entry">+</button><button data-field="assignmentGroup" class="default-btn">Set as Default</button></div></div>
                            <div class="field-group"><label for="assigned-to-input">Assigned To</label><div class="custom-dropdown-container"><div class="input-wrapper"><input type="text" id="assigned-to-input" data-field="assignedTo" class="custom-dropdown-input" placeholder="Type or select a user..." autocomplete="off"><button class="dropdown-arrow" data-field="assignedTo">&#9660;</button></div><div class="dropdown-panel" id="assigned-to-panel"></div></div><div class="button-row"><button data-field="assignedTo" class="plus-btn" title="Save this entry">+</button><button data-field="assignedTo" class="default-btn">Set as Default</button></div></div>
                        </div>
                    </div>
                    <div class="field-group full-width"><label for="short-description-input">Short Description</label><textarea id="short-description-input" rows="3" placeholder="Enter a brief summary..."></textarea></div>
                    <button id="snu-fill-btn">Fill & Close</button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', MODAL_HTML);

        const modalContainer = document.getElementById('snu-modal-container'); // Renamed to avoid conflict in auto-open
        const BLANK_ENTRY = '[Blank]';
        const fieldsConfig = {
            category: { isStatic: true, select: modalContainer.querySelector('#category-input'), defaultKey: 'snu_defaultCategory', staticOptions: [ { text: BLANK_ENTRY, value: BLANK_ENTRY }, { text: '-- None --', value: '' }, { text: 'Request', value: 'request' }, { text: 'Inquiry / Help', value: 'inquiry' }, { text: 'Software', value: 'software' }, { text: 'Hardware', value: 'hardware' }, { text: 'Network', value: 'network' }, { text: 'Database', value: 'database' }, { text: 'Phone', value: 'Phone' }, { text: 'Audio/Visual', value: 'Audio/Visual' }, { text: 'Facilities', value: 'Facilities' } ] },
            channel: { isStatic: true, select: modalContainer.querySelector('#channel-input'), defaultKey: 'snu_defaultChannel', staticOptions: [ { text: BLANK_ENTRY, value: BLANK_ENTRY }, { text: 'Email', value: 'email' }, { text: 'Phone', value: 'phone' }, { text: 'Self-service', value: 'self-service' }, { text: 'Walk-in', value: 'walk-in' } ] },
            state: { isStatic: true, select: modalContainer.querySelector('#state-input'), defaultKey: 'snu_defaultState', staticOptions: [ { text: BLANK_ENTRY, value: BLANK_ENTRY }, { text: 'New', value: '1' }, { text: 'Active', value: '2' }, { text: 'Awaiting Problem', value: '3' }, { text: 'Awaiting User Info', value: '4' }, { text: 'Awaiting Evidence', value: '5' }, { text: 'Resolved', value: '6' } ] },
            caller: { isStatic: false, input: modalContainer.querySelector('#caller-input'), panel: modalContainer.querySelector('#caller-panel'), storageKey: 'snu_savedCallers', defaultKey: 'snu_defaultCaller' },
            configurationItem: { isStatic: false, input: modalContainer.querySelector('#config-item-input'), panel: modalContainer.querySelector('#config-item-panel'), storageKey: 'snu_savedConfigItems', defaultKey: 'snu_defaultConfigItem' },
            assignmentGroup: { isStatic: false, input: modalContainer.querySelector('#assignment-group-input'), panel: modalContainer.querySelector('#assignment-group-panel'), storageKey: 'snu_savedAssignmentGroups', defaultKey: 'snu_defaultAssignmentGroup' },
            assignedTo: { isStatic: false, input: modalContainer.querySelector('#assigned-to-input'), panel: modalContainer.querySelector('#assigned-to-panel'), storageKey: 'snu_savedAssignedTo', defaultKey: 'snu_defaultAssignedTo' }
        };

        const getTargetDoc = () => {
            const frame = document.getElementById('gsft_main');
            return frame ? frame.contentWindow.document : document;
        };
        
        const removeEntry = (fieldName, optionText) => { const config = fieldsConfig[fieldName]; chrome.storage.sync.get(config.storageKey, r => { const o = (r[config.storageKey]||[]).filter(opt => opt !== optionText); chrome.storage.sync.set({[config.storageKey]: o}, ()=>populateDropdown(fieldName, o)); }); };
        const populateDropdown = (fieldName, options) => {
            const config = fieldsConfig[fieldName]; config.panel.innerHTML='';
            ['[Blank]', ...options].forEach(optionText => { const i=document.createElement('div');i.className='dropdown-item';const t=document.createElement('span');t.textContent=optionText;i.appendChild(t);if(optionText !== '[Blank]'){const r=document.createElement('button');r.className='remove-item-btn';r.innerHTML='&times;';r.title=`Remove "${optionText}"`;r.addEventListener('click',e=>{e.stopPropagation();removeEntry(fieldName,optionText);});i.appendChild(r);} i.addEventListener('click', ()=>{config.input.value=(optionText==='[Blank]')?'':optionText;config.panel.classList.remove('show');}); config.panel.appendChild(i);});
        };
        const checkIfDefault = (fieldName) => { const config = fieldsConfig[fieldName]; const btn = modalContainer.querySelector(`.default-btn[data-field="${fieldName}"]`); if(!btn) return; const val = config.isStatic ? config.select.value : config.input.value; chrome.storage.sync.get(config.defaultKey, r => { btn.classList.toggle('is-default', r[config.defaultKey] !== undefined && val === r[config.defaultKey] && val !== '' && val !== '[Blank]'); }); };
        const loadDataForField = (fieldName) => {
            const config = fieldsConfig[fieldName]; chrome.storage.sync.get([config.defaultKey, config.storageKey].filter(Boolean), r => {
                const defaultVal = r[config.defaultKey]; if(config.isStatic){config.select.innerHTML=''; config.staticOptions.forEach(opt=>{const o=document.createElement('option');o.value=opt.value;o.textContent=opt.text;config.select.appendChild(o);}); config.select.value=defaultVal||'[Blank]';}else{populateDropdown(fieldName,r[config.storageKey]||[]); config.input.value=defaultVal||'';}
                checkIfDefault(fieldName);
            });
        };
        const addEntry = (fieldName) => { const config = fieldsConfig[fieldName]; const newValue = config.input.value.trim(); if(newValue && newValue !== BLANK_ENTRY){chrome.storage.sync.get(config.storageKey,r=>{let o=r[config.storageKey]||[];if(!o.includes(newValue)){o.unshift(newValue);chrome.storage.sync.set({[config.storageKey]:o},()=>populateDropdown(fieldName,o));}});}};
        const setDefault = (fieldName) => { const config = fieldsConfig[fieldName]; const v = config.isStatic ? config.select.value : config.input.value; chrome.storage.sync.set({[config.defaultKey]:v},()=>checkIfDefault(fieldName));};
        const filterDropdown = (fieldName) => { const config = fieldsConfig[fieldName]; const f = config.input.value.toLowerCase(); Array.from(config.panel.children).forEach(i=>i.style.display=i.textContent.toLowerCase().includes(f)?'':'none');};
        const fillServiceNowForm = (data) => {
            const targetDoc = getTargetDoc();
            const idMap={'sys_display.incident.caller_id':data.caller,'incident.category':data.category,'sys_display.incident.cmdb_ci':data.configurationItem,'incident.contact_type':data.channel,'sys_display.incident.assignment_group':data.assignmentGroup,'sys_display.incident.assigned_to':data.assignedTo,'incident.state':data.state,'incident.short_description':data.shortDescription};
            for(const id in idMap){const v=idMap[id];if(v==='[Blank]'||v===undefined||v===null)continue;const el=targetDoc.getElementById(id);if(el){el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}));}}
        };
        const applyAllDefaults = () => { chrome.storage.sync.get(Object.values(fieldsConfig).map(c=>c.defaultKey),d=>{const data={caller:d.snu_defaultCaller,category:d.snu_defaultCategory,configurationItem:d.snu_defaultConfigItem,channel:d.snu_defaultChannel,assignmentGroup:d.snu_defaultAssignmentGroup,assignedTo:d.snu_defaultAssignedTo,state:d.snu_defaultState,shortDescription:''};fillServiceNowForm(data);});};
        const newApplyAllDefaults = () => { // Renamed to avoid conflict if old one is still referenced
            console.log("SN QuickFill: applyAllDefaults called. Setting isApplyingDefaults=true.");
            isApplyingDefaults = true;
            chrome.storage.sync.get(Object.values(fieldsConfig).map(c => c.defaultKey), defaults => {
                const data = { caller: defaults.snu_defaultCaller, category: defaults.snu_defaultCategory, configurationItem: defaults.snu_defaultConfigItem, channel: defaults.snu_defaultChannel, assignmentGroup: defaults.snu_defaultAssignmentGroup, assignedTo: defaults.snu_defaultAssignedTo, state: defaults.snu_defaultState, shortDescription: '' };
                console.log("SN QuickFill: applyAllDefaults - got defaults, calling fillServiceNowForm.");
                fillServiceNowForm(data);
                console.log("SN QuickFill: applyAllDefaults - fillServiceNowForm finished. Scheduling flag reset.");
                setTimeout(() => {
                    console.log("SN QuickFill: applyAllDefaults - Resetting isApplyingDefaults=false.");
                    isApplyingDefaults = false;
                }, 750); // Further increased timeout
            });
        };
        // Creates and injects the "Quickfill Defaults" button into a given anchor element.
        const injectButtonElements = (iframeDoc, anchorElement) => {
            if (iframeDoc.getElementById('snu-quickfill-btn')) {
                return; // Button already injected
            }
            console.log("SN QuickFill: Injecting 'Quickfill Defaults' button logic.");
            const container = iframeDoc.createElement('div');
            container.id = 'snu-quickfill-btn-container';
            container.style.display = 'inline-block';
            container.style.marginRight = '5px';

            const button = iframeDoc.createElement('button');
            button.id = 'snu-quickfill-btn';
            button.type = 'button';
            button.textContent = 'Quickfill Defaults';
            button.style.setProperty('background-color', '#4CAF50', 'important');
            button.style.setProperty('color', 'white', 'important');
            button.style.setProperty('border', 'none', 'important'); // Making border !important too
            // Consider adding ServiceNow's button classes for consistent styling
            // e.g., button.classList.add('form_action_button', 'header');
            button.addEventListener('click', newApplyAllDefaults); // Use the new version with flag logic

            container.appendChild(button);
            // Insert the container with your button *before* the anchorElement
            if (anchorElement.parentNode) {
                anchorElement.parentNode.insertBefore(container, anchorElement);
                console.log("SN QuickFill: 'Quickfill Defaults' button injected before anchor element.", container);
            } else {
                console.warn("SN QuickFill: Anchor element for 'Quickfill Defaults' button has no parent. Button not injected.");
            }
        };

        // Tries to find the anchor point and inject the on-page button.
        const tryInjectOnPageButton = (currentIframeDoc) => {
            if (!currentIframeDoc) return;
            waitForElement(
                '#cxs_maximize_results', // User-confirmed selector for the button's anchor
                currentIframeDoc,
                (actionButtonContainer) => injectButtonElements(currentIframeDoc, actionButtonContainer),
                "On-page button anchor (#cxs_maximize_results)",
                true // Suppress warning for repeated checks by observers
            );
        };

        const injectQuickfillButton = () => {
            // Initial call to inject the button
            // This will be handled by the iframe monitoring logic once the iframe is ready.
        };

        modalContainer.querySelectorAll('[data-field]').forEach(el => {
            const fn=el.dataset.field; if(!fn||!fieldsConfig[fn])return;
            if(el.classList.contains('plus-btn'))el.addEventListener('click',()=>addEntry(fn));
            if(el.classList.contains('default-btn'))el.addEventListener('click',()=>setDefault(fn));
            if(el.classList.contains('dropdown-arrow'))el.addEventListener('click',()=>fieldsConfig[fn].panel.classList.toggle('show'));
            if(el.tagName==='SELECT'||el.classList.contains('custom-dropdown-input')){el.addEventListener('input',()=>checkIfDefault(fn));el.addEventListener('change',()=>checkIfDefault(fn));}
            if(el.classList.contains('custom-dropdown-input')){el.addEventListener('input',()=>filterDropdown(fn));el.addEventListener('focus',()=>fieldsConfig[fn].panel.classList.add('show'));}
        });
        
        modalContainer.querySelector('#snu-close-btn').addEventListener('click',()=>{
            modalContainer.style.display='none';
            modalWasManuallyClosed = true; // Set flag when X is clicked
            console.log("SN QuickFill: Modal closed with X. modalWasManuallyClosed=true");
        });
        modalContainer.querySelector('#snu-fill-btn').addEventListener('click', () => {
            console.log("SN QuickFill: Fill & Close clicked. Setting isApplyingDefaults=true.");
            isApplyingDefaults = true;
            const dataToFill = {};
            for (const fieldName in fieldsConfig) dataToFill[fieldName] = fieldsConfig[fieldName].isStatic ? fieldsConfig[fieldName].select.value : fieldsConfig[fieldName].input.value;
            dataToFill.shortDescription = modalContainer.querySelector('#short-description-input').value;
            fillServiceNowForm(dataToFill);
            modalContainer.style.display = 'none';
            modalWasManuallyClosed = true; // Treat "Fill & Close" like a manual close for re-open prevention
            console.log("SN QuickFill: Fill & Close - Modal hidden. modalWasManuallyClosed=true");
            console.log("SN QuickFill: Fill & Close - fillServiceNowForm finished. Scheduling flag reset.");
            setTimeout(() => {
                console.log("SN QuickFill: Fill & Close - Resetting isApplyingDefaults=false.");
                isApplyingDefaults = false;
            }, 750); // Further increased timeout
        });
        const autoToggle=modalContainer.querySelector('#snu-auto-open-toggle');
        autoToggle.addEventListener('change',e=>chrome.storage.sync.set({'snu_auto_open':e.target.checked}));
        chrome.storage.sync.get('snu_auto_open',r=>autoToggle.checked=!!r.snu_auto_open);
        
        // Close dropdowns when clicking elsewhere
        window.addEventListener('click', (event) => {
            // Iterate over all custom dropdown panels that are currently shown
            const openDropdownPanels = modalContainer.querySelectorAll('.dropdown-panel.show');
            openDropdownPanels.forEach(panel => {
                // Find the encompassing container for this specific dropdown
                const dropdownContainer = panel.closest('.custom-dropdown-container');
                // If the click was outside this specific dropdown's container, close the panel
                if (dropdownContainer && !dropdownContainer.contains(event.target)) {
                    panel.classList.remove('show');
                }
            });
        });

        for (const fieldName in fieldsConfig) { loadDataForField(fieldName); }
        injectQuickfillButton();

        // --- IFRAME MONITORING (LOAD EVENTS AND MUTATIONS) ---
        let iframeObserver = null; 

        const processIframeContent = (currentIframeDoc) => {
            if (!currentIframeDoc) {
                console.warn("SN QuickFill: processIframeContent called with no document.");
                return;
            }
            console.log("SN QuickFill: Processing iframe content.");
            checkForNewRecordAndOpen(currentIframeDoc);
            tryInjectOnPageButton(currentIframeDoc);
        };

            const checkForNewRecordAndOpen = (currentIframeDoc) => {
                if (modalWasManuallyClosed) {
                    console.log("SN QuickFill: checkForNewRecordAndOpen - modalWasManuallyClosed is TRUE. Skipping modal open logic.");
                    // We don't reset it here; it gets reset on iframe load or when modal is programmatically opened.
                    return;
                }

                if (isApplyingDefaults) {
                    console.log("SN QuickFill: checkForNewRecordAndOpen - isApplyingDefaults is TRUE. Skipping modal open logic.");
                    return;
                }
                // console.log("SN QuickFill: checkForNewRecordAndOpen - isApplyingDefaults is FALSE. Proceeding.");

                // Don't show modal if the document/tab is not focused
                if (!document.hasFocus()) {
                    // console.log("SN QuickFill: checkForNewRecordAndOpen - Document does not have focus, skipping modal display.");
                    return;
                }
                // console.log("SN QuickFill: checkForNewRecordAndOpen - Document has focus.");

                chrome.storage.sync.get('snu_auto_open', (settingResult) => {
                    const autoOpenEnabled = !!settingResult.snu_auto_open;
                    // console.log(`SN QuickFill: checkForNewRecordAndOpen - Auto-open setting is: ${autoOpenEnabled}`);
                    if (!settingResult.snu_auto_open) {
                        return;
                    }

                    const modal = document.getElementById('snu-modal-container');
                    if (modal && modal.style.display === 'flex') {
                        // console.log("SN QuickFill: checkForNewRecordAndOpen - Modal already open, skipping.");
                        return;
                    }
                    // console.log("SN QuickFill: checkForNewRecordAndOpen - Modal is not already open.");

                    waitForElement('h1.form_header div', currentIframeDoc, (headerDiv) => {
                        const headerText = headerDiv ? headerDiv.textContent.trim().toLowerCase() : "";
                        // console.log(`SN QuickFill: checkForNewRecordAndOpen - Found header text: "${headerText}"`);
                        if (headerText === "new record") {
                            console.log("SN QuickFill: checkForNewRecordAndOpen - 'New Record' text matched. Conditions met. Opening modal.");
                            if (modal) {
                                modal.style.display = 'flex';
                                modalWasManuallyClosed = false; // Reset flag as modal is now programmatically opened
                            } else {
                                console.error("SN QuickFill: checkForNewRecordAndOpen - Modal element not found when trying to open!");
                            }
                        } else {
                            // console.log("SN QuickFill: checkForNewRecordAndOpen - 'New Record' text did NOT match.");
                        }
                    }, "'New Record' header (check for auto-open)", true);
                });
            };

        waitForElement('#gsft_main', document, (iframeElement) => {
            console.log("SN QuickFill: Monitoring - Found #gsft_main iframe.", iframeElement);

            const setupMutationObserver = (docToObserve) => {
                if (!docToObserve) return;
                waitForElement('body', docToObserve, (iframeBody) => {
                    if (iframeObserver) {
                        iframeObserver.disconnect();
                        console.log("SN QuickFill: Disconnected old MutationObserver.");
                    }
                    iframeObserver = new MutationObserver(() => {
                        // console.log("SN QuickFill: iframe body mutation detected.");
                        // Get the latest document reference from the iframe contentWindow
                        const latestIframeDoc = iframeElement.contentWindow ? iframeElement.contentWindow.document : null;
                        if (latestIframeDoc) {
                            processIframeContent(latestIframeDoc);
                        }
                    });
                    iframeObserver.observe(iframeBody, { childList: true, subtree: true });
                    console.log("SN QuickFill: MutationObserver attached to iframe body.");
                }, "iframe body for MutationObserver", true);
            };

            // Initial processing when iframe is first found
            if (iframeElement.contentWindow && iframeElement.contentWindow.document) {
                const initialIframeDoc = iframeElement.contentWindow.document;
                processIframeContent(initialIframeDoc);
                setupMutationObserver(initialIframeDoc);
            } else {
                console.log("SN QuickFill: iframe document not immediately ready on find, will wait for 'load' event.");
            }

            // Listen for iframe 'load' events (covers navigation that changes src)
            iframeElement.addEventListener('load', () => {
                console.log("SN QuickFill: iframe 'load' event detected.");
                const loadedIframeDoc = iframeElement.contentWindow ? iframeElement.contentWindow.document : null;
                if (loadedIframeDoc) {
                    processIframeContent(loadedIframeDoc);
                    modalWasManuallyClosed = false; // Reset flag on iframe load
                    console.log("SN QuickFill: iframe 'load' event. modalWasManuallyClosed reset to false.");
                    setupMutationObserver(loadedIframeDoc); // Re-setup observer on new document's body
                }
            });

        }, "main ServiceNow iframe for monitoring");
        
        window.addEventListener('beforeunload', () => {
            if (iframeObserver) { // Check the observer declared in the outer scope
                console.log("SN QuickFill: Window unloading. Disconnecting any active iframe observer.");
                iframeObserver.disconnect();
                iframeObserver = null;
            }
        });
    };

    // --- SCRIPT ENTRY POINT ---
    
    // Listen for the message from the background script to toggle the modal
    chrome.runtime.onMessage.addListener((request) => {
        if (request.type === "SNU_TOGGLE_MODAL") {
            let modal = document.getElementById('snu-modal-container');
            if (modal) {
                modal.style.display = (modal.style.display === 'none') ? 'flex' : 'none';
            }
        }
    });

    // Run the main initialization logic
    main();
})();
