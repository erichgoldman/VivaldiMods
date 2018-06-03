/*
* BETTER NOTES (a mod for Vivaldi)
* Written by LonM
* No Copyright Reserved
* VIVALDI MOD COMPONENT
*
* additional components used:
* https://github.com/Sporif/CustomHooks/blob/master/hooks/theme-css-variables.js
*/
(function betterNotes(){
"use strict";

const EDITOR_URI = "chrome-extension://mpognobbkildjkofajifpdfhcoklimli/user_modfiles/betterNotesEditor.html";
const VIVALDI_URI = "chrome-extension://mpognobbkildjkofajifpdfhcoklimli/browser.html";
let EDITOR_SOURCE;


function onMessage(e){
    if(e.origin !== EDITOR_URI){
        console.error("Bad message incoming. There may be a threat actor afoot");
        return;
    }
    switch(e.data.verb){
        case "INIT_YES":
            return onInit();
        case "NOTE_TEXT":
            return onNoteText(e.data.note);
        case "NOTE_TITLE":
            return onTitle(e.data.title);
        default:
            console.error('unknown message format', e);
    }
}

function onInit(){
    sendThemeData();
    sendNote();
}

function onNoteText(text){
    // vivaldi.notes.update
}

function onTitle(title){
    // vivaldi.notes.update
}



function sendMessage(msg){
    if(EDITOR_SOURCE){
        EDITOR_SOURCE.contentWindow.postMessage(msg, EDITOR_URI);
    } else {
        console.error("tried to message before notes tab  was ready");
    }
}

function sendInit(attempts){
    if(attempts < 1){
        console.error("Failed to init messaging to notes tab");
        return;
    }
    if(!document.querySelector(`webview[src="${EDITOR_URI}"]`)){
        setTimeout(() => {sendInit(attempts-1);}, 100);
        return;
    }
    EDITOR_SOURCE = document.querySelector(`webview[src="${EDITOR_URI}"]`);
    sendMessage({
        verb: "INIT_QRY"
    });
}

function sendNote(){
    const selection = document.querySelector("#notes-panel div[data-selected]");
    if(!selection){
        sendEmpty();
        return;
    }
    vivaldi.notes.get(selection.getAttribute("data-id"), note => {
        const noteObject = note[0];
        const preview = document.querySelector("#notes-panel  div.md.note");
        let previewText = "<h1>Enable markdown generator in panel</h1>";
        if(preview){
            previewText = preview.innerHTML;
        }
        sendMessage({
            verb: "NOTE",
            note: noteObject,
            preview: previewText
        });
    });
}

function sendEmpty(){
    sendMessage({
        verb: "EMPTY"
    });
}

function sendThemeData() {
    if(!EDITOR_SOURCE){return;}
    var css = ":root {\n "+document.body.style.cssText.replace(/;/g, ';\n').replace(/:/g, ': ')+" }";
    sendMessage({
        verb: "THEME",
        theme: css
    });
}


/*
* NOTES TAB MANAGEMENT
* Functions helping with management of the notes tab
*/

// Start the connection to the notes tab
function connectToNotesTab(){
    setTimeout(() => {sendInit(3);}, 100);
}

// Get the notes tab if it exists, or create a new one
function getOrCreateNotesTab(){
    chrome.tabs.query({url: EDITOR_URI}, tabs => {
        if(tabs.length > 0){
            chrome.tabs.highlight({tabs: tabs[0].id});
        } else {
            chrome.tabs.create({"url": EDITOR_URI}, tab => {
                connectToNotesTab();
            });
        }
    });
}

// Open the Notes Tab
function openNotesTab(){
    chrome.tabs.getSelected(null, tab => {
        if(tab.url !== EDITOR_URI){
            getOrCreateNotesTab();
        } else {
            connectToNotesTab();
        }
    });
}





const PANEL_CHANGE_OBSERVER = new MutationObserver(mutationrecords => {
    const panel = document.querySelector("#notes-panel");
    if(panel){
        sendNote();
    }
});


/* Wait until the panel is ready before activating the mod */
function observePanels(){
    const panels = document.querySelector("#panels");
    PANEL_CHANGE_OBSERVER.observe(panels, {attributes: true, subtree: true});
}



function observeThemes(){
    THEME_OBSERVER.observe(document.body, {
		attributes: true,
		attributeFilter: ['style']
	});
}
const THEME_OBSERVER = new MutationObserver(sendThemeData);



function makeDebugButton(){
    const newBtn = document.createElement("button");
    newBtn.innerHTML = "<span>notething</span>";
    newBtn.addEventListener("click", openNotesTab);
    document.querySelector("#footer > div.status-toolbar").appendChild(newBtn);
}



/**
 * Check that the browser is loaded up properly, and init the mod
 */
function initMod(){
    if(!document.querySelector("#browser")){
        setTimeout(initMod, 500);
        return;
    }

    observePanels();
    observeThemes();
    addEventListener('message', onMessage);
    makeDebugButton();
}

initMod();

})();
