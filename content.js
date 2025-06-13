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
        let modalWasManuallyClosed = false; // Flag to prevent re-open after manual 'X' close

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

        const modalContainer = document.getElementById('snu-modal-container');
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
        
        const removeEntry = (fieldName, optionText) => { const config = fieldsConfig[fieldName]; chrome.storage.sync.get(config.storageKey, r => { const o = (r[config.storageKey]||[]).filter(opt => opt !== optionText); chrome.storage.sync.set({[config.storageKey]: o}, ()=>{
            console.log(`SN QuickFill: removeEntry - Attempting to remove "${optionText}" from ${fieldName}. New list to save:`, JSON.stringify(o));
            if (chrome.runtime.lastError) {
                console.warn(`SN QuickFill: Error during storage.sync.set in removeEntry for ${fieldName}:`, chrome.runtime.lastError.message);
                // Optionally, you might want to re-populate with the original list 'r[config.storageKey]' if the set failed,
                // or at least not proceed with a potentially empty 'o'. For now, just log.
                return; // Potentially stop if set failed
            }
            populateDropdown(fieldName, o); 
        
        }); }); };
                const populateDropdown = (fieldName, options) => {
            // Log options *before* clearing, to see if they were already empty
            if (!options || options.length === 0) {
                console.warn(`SN QuickFill: populateDropdown called for ${fieldName} with EMPTY or NO options. Current panel items: ${fieldsConfig[fieldName].panel.children.length}`);
            }
            // console.log(`SN QuickFill: populateDropdown called for ${fieldName} with options:`, JSON.stringify(options)); // Existing log
            const config = fieldsConfig[fieldName]; config.panel.innerHTML='';
            ['[Blank]', ...options].forEach(optionText => { 
                const itemDiv = document.createElement('div'); itemDiv.className='dropdown-item';
                const textSpan = document.createElement('span'); textSpan.textContent=optionText; itemDiv.appendChild(textSpan);
                if(optionText !== '[Blank]'){
                    const removeBtn = document.createElement('button');removeBtn.className='remove-item-btn';removeBtn.innerHTML='&times;';removeBtn.title=`Remove "${optionText}"`;
                    removeBtn.addEventListener('click',e=>{e.stopPropagation();removeEntry(fieldName,optionText);});
                    itemDiv.appendChild(removeBtn);
                } 
                itemDiv.addEventListener('click', () => {
                    config.input.value = (optionText === BLANK_ENTRY) ? '' : optionText;
                    config.panel.classList.remove('show');
                    // Manually dispatch an input event so listeners (like checkIfDefault) are triggered
                    config.input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                }); 
                config.panel.appendChild(itemDiv);
            });
        };
        const checkIfDefault = (fieldName) => { 
            const config = fieldsConfig[fieldName]; 
            const btn = modalContainer.querySelector(`.default-btn[data-field="${fieldName}"]`); 
            if(!btn) return; 
            
            let currentFieldValue = config.isStatic ? config.select.value : config.input.value;
            if (currentFieldValue === BLANK_ENTRY) { // Canonicalize BLANK_ENTRY from select to '' for comparison
                currentFieldValue = ''; 
            }

            chrome.storage.sync.get(config.defaultKey, r => { 
                const storedDefault = r[config.defaultKey]; // Stored default is already canonical ('') if set from BLANK_ENTRY
                btn.classList.toggle('is-default', storedDefault !== undefined && currentFieldValue === storedDefault); 
            }); 
        };
        const loadDataForField = (fieldName) => {
            const config = fieldsConfig[fieldName]; chrome.storage.sync.get([config.defaultKey, config.storageKey].filter(Boolean), r => {
                const defaultVal = r[config.defaultKey]; if(config.isStatic){config.select.innerHTML=''; config.staticOptions.forEach(opt=>{const o=document.createElement('option');o.value=opt.value;o.textContent=opt.text;config.select.appendChild(o);}); config.select.value=defaultVal||'[Blank]';}else{populateDropdown(fieldName,r[config.storageKey]||[]); config.input.value=defaultVal||'';}
                checkIfDefault(fieldName);
            });
        };
        const addEntry = (fieldName) => { 
            const config = fieldsConfig[fieldName]; 
            const newValue = config.input.value.trim(); 
            if(newValue && newValue !== BLANK_ENTRY){
                chrome.storage.sync.get(config.storageKey,r=>{
                    let o=r[config.storageKey]||[];
                    if(!o.includes(newValue)){
                        o.unshift(newValue);
                        console.log(`SN QuickFill: addEntry - Attempting to add "${newValue}" to ${fieldName}. New list to save:`, JSON.stringify(o));
                        chrome.storage.sync.set({[config.storageKey]:o},()=>{
                            if (chrome.runtime.lastError) {
                                console.warn(`SN QuickFill: Error during storage.sync.set in addEntry for ${fieldName}:`, chrome.runtime.lastError.message);
                                return; // Potentially stop if set failed
                            }
                            populateDropdown(fieldName,o)
                        });
                        config.input.value = newValue; // Ensure the input field reflects the newly added value
                    }
                });
            }
        };
                const setDefault = (fieldName) => { 
            const config = fieldsConfig[fieldName]; 
            let valueToSet = config.isStatic ? config.select.value : config.input.value;
            if (valueToSet === BLANK_ENTRY) { // Canonicalize BLANK_ENTRY from select to '' for storage
                valueToSet = '';
            }
            chrome.storage.sync.set({[config.defaultKey]: valueToSet}, () => {
                if (chrome.runtime.lastError) {
                    console.warn(`SN QuickFill: Error during storage.sync.set in setDefault for ${fieldName}:`, chrome.runtime.lastError.message);
                }
                checkIfDefault(fieldName)
            });
        };
        
        const filterDropdown = (fieldName) => { const config = fieldsConfig[fieldName]; const f = config.input.value.toLowerCase(); Array.from(config.panel.children).forEach(i=>i.style.display=i.textContent.toLowerCase().includes(f)?'':'none');};
        const fillServiceNowForm = (data) => {
            const targetDoc = getTargetDoc();
            const idMap={'sys_display.incident.caller_id':data.caller,'incident.category':data.category,'sys_display.incident.cmdb_ci':data.configurationItem,'incident.contact_type':data.channel,'sys_display.incident.assignment_group':data.assignmentGroup,'sys_display.incident.assigned_to':data.assignedTo,'incident.state':data.state,'incident.short_description':data.shortDescription};
            
            for(const id in idMap){
                const v=idMap[id];
                // Skip if value is blank, undefined, null, or an empty string (unless it's a deliberate blanking)
                if(v === BLANK_ENTRY || v === undefined || v === null || (typeof v === 'string' && v.trim() === '' && v !== BLANK_ENTRY) ) {
                    if (v === BLANK_ENTRY) { // If explicitly [Blank], try to clear the field
                        const elToClear = targetDoc.getElementById(id);
                        if (elToClear) {
                            elToClear.value = '';
                            elToClear.dispatchEvent(new Event('input',{bubbles:true, cancelable: true}));
                            elToClear.dispatchEvent(new Event('change',{bubbles:true, cancelable: true}));
                            elToClear.dispatchEvent(new Event('blur',{bubbles:false, cancelable: true}));
                        }
                    }
                    continue;
                }

                const el=targetDoc.getElementById(id);
                if(el){
                    if (id.startsWith('sys_display.')) { // Special handling for ServiceNow reference fields
                        el.focus(); 
                        el.value = v;
                        el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                        // Simulating Enter can sometimes help trigger reference field lookups
                        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true, charCode: 13, keyCode: 13, which: 13 }));
                        el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true, charCode: 13, keyCode: 13, which: 13 }));
                        el.dispatchEvent(new Event('blur', { bubbles: false, cancelable: true }));
                    } else { // For select lists, textareas, or other simple inputs
                        el.value = v;
                        el.dispatchEvent(new Event('input',{bubbles:true, cancelable: true}));
                        el.dispatchEvent(new Event('change',{bubbles:true, cancelable: true}));
                        el.dispatchEvent(new Event('blur',{bubbles:false, cancelable: true}));
                    }
                } else {
                    console.warn(`SN QuickFill: Element with ID "${id}" not found in target document.`);
                }
            }
        };
        const newApplyAllDefaults = () => {
            isApplyingDefaults = true;
            chrome.storage.sync.get(Object.values(fieldsConfig).map(c => c.defaultKey), defaults => {
                const data = { caller: defaults.snu_defaultCaller, category: defaults.snu_defaultCategory, configurationItem: defaults.snu_defaultConfigItem, channel: defaults.snu_defaultChannel, assignmentGroup: defaults.snu_defaultAssignmentGroup, assignedTo: defaults.snu_defaultAssignedTo, state: defaults.snu_defaultState, shortDescription: '' };
                fillServiceNowForm(data);
                setTimeout(() => {
                    isApplyingDefaults = false;
                }, 750); // Further increased timeout
            });
        };
        // Creates and injects the "Quickfill Defaults" button into a given anchor element.
        const injectButtonElements = (iframeDoc, anchorElement) => {
            if (iframeDoc.getElementById('snu-quickfill-btn')) {
                return; // Button already injected
            }
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
            button.addEventListener('click', newApplyAllDefaults);

            container.appendChild(button);
            // Insert the container with your button *before* the anchorElement
            if (anchorElement.parentNode) {
                anchorElement.parentNode.insertBefore(container, anchorElement);
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
        });
        modalContainer.querySelector('#snu-fill-btn').addEventListener('click', () => {
            isApplyingDefaults = true;
            const dataToFill = {};
            for (const fieldName in fieldsConfig) dataToFill[fieldName] = fieldsConfig[fieldName].isStatic ? fieldsConfig[fieldName].select.value : fieldsConfig[fieldName].input.value;
            dataToFill.shortDescription = modalContainer.querySelector('#short-description-input').value;
            fillServiceNowForm(dataToFill);
            modalContainer.style.display = 'none';
            modalWasManuallyClosed = true; // Treat "Fill & Close" like a manual close for re-open prevention purposes
            setTimeout(() => {
                isApplyingDefaults = false;
            }, 750); // Timeout to allow ServiceNow to process changes before re-evaluating auto-open
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
            checkForNewRecordAndOpen(currentIframeDoc);
            tryInjectOnPageButton(currentIframeDoc);
        };

            const checkForNewRecordAndOpen = (currentIframeDoc) => {
                if (modalWasManuallyClosed) {
                    console.log("SN QuickFill: checkForNewRecordAndOpen - modalWasManuallyClosed is TRUE. Skipping modal open logic.");
                    // This flag is reset on iframe load or when the modal is programmatically opened.
                    return;
                }

                if (isApplyingDefaults) {
                    console.log("SN QuickFill: checkForNewRecordAndOpen - isApplyingDefaults is TRUE. Skipping modal open logic.");
                    return;
                }

                // Don't show modal if the document/tab is not focused
                if (!document.hasFocus()) {
                    return;
                }

                // Guard against chrome.storage.sync being unavailable, e.g., if extension context is invalidated
                if (typeof chrome === 'undefined') {
                    console.warn("SN QuickFill: 'chrome' object is undefined. Cannot access storage. Skipping auto-open check.");
                    return;
                }
                if (typeof chrome.storage === 'undefined') {
                    console.warn("SN QuickFill: 'chrome.storage' is undefined. Cannot access storage.sync. Skipping auto-open check.");
                    return;
                }
                if (typeof chrome.storage.sync === 'undefined') {
                    console.warn("SN QuickFill: 'chrome.storage.sync' is undefined. Skipping auto-open check.");
                    return;
                }

                chrome.storage.sync.get('snu_auto_open', (settingResult) => {
                    // It's crucial to check chrome.runtime.lastError within callbacks from chrome.* APIs
                    if (chrome.runtime.lastError) {
                        console.warn("SN QuickFill: Error during chrome.storage.sync.get('snu_auto_open'):", chrome.runtime.lastError.message);
                        return; // Don't proceed if the storage call itself failed
                    }

                    const autoOpenEnabled = !!settingResult.snu_auto_open;
                    if (!settingResult.snu_auto_open) {
                        return;
                    }

                    const modal = document.getElementById('snu-modal-container');
                    if (modal && modal.style.display === 'flex') {
                        return;
                    }

                    waitForElement('h1.form_header div', currentIframeDoc, (headerDiv) => {
                        const headerText = headerDiv ? headerDiv.textContent.trim().toLowerCase() : "";
                        if (headerText === "new record") {
                            if (modal) {
                                modal.style.display = 'flex';
                                modalWasManuallyClosed = false; // Reset flag as modal is now programmatically opened
                            } else {
                                console.error("SN QuickFill: checkForNewRecordAndOpen - Modal element not found when trying to open!");
                            }
                        }
                    }, "'New Record' header (check for auto-open)", true);
                });
            };

        waitForElement('#gsft_main', document, (iframeElement) => {
            const setupMutationObserver = (docToObserve) => {
                if (!docToObserve) return;
                waitForElement('body', docToObserve, (iframeBody) => {
                    if (iframeObserver) {
                        iframeObserver.disconnect();
                    }
                    iframeObserver = new MutationObserver(() => {
                        // Get the latest document reference from the iframe contentWindow
                        const latestIframeDoc = iframeElement.contentWindow ? iframeElement.contentWindow.document : null;
                        if (latestIframeDoc) {
                            processIframeContent(latestIframeDoc);
                        }
                    });
                    iframeObserver.observe(iframeBody, { childList: true, subtree: true });
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
                    modalWasManuallyClosed = false; // Reset manual close flag on a full iframe load
                    setupMutationObserver(loadedIframeDoc); // Re-setup observer on new document's body
                }
            });

        }, "main ServiceNow iframe for monitoring");
        
        window.addEventListener('beforeunload', () => {
            if (iframeObserver) { // Check the observer declared in the outer scope
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
