// ==UserScript==
// @name         MidenQuestPlus
// @namespace    MidenQuestPlus_tampermonkey
// @version      0.97
// @description  Provides the user with some enhancements to MidenQuest
// @author       Ryalane
// @updateURL    https://github.com/Ryalane/MidenQuestPlus/raw/master/MQP.user.js
// @match        http://www.midenquest.com/Game.aspx
// @resource     MainStylesheet https://raw.githubusercontent.com/Ryalane/MidenQuestPlus/master/style.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @homepage     https://github.com/Ryalane/MidenQuestPlus
// ==/UserScript==

(function() {
    'use strict';
    GM_addStyle(GM_getResourceText("MainStylesheet"));

    var versionString = "";
    if (typeof GM_info !== "undefined") {
        versionString = GM_info.script.version;
        console.log(versionString);
    }

/* Handle Settings */
var Settings = {
  setupUI: function () {

    // Make the container
    $('body').prepend('<div id="Custom_MainBar"></div>');
    // Set the title
    $('#Custom_MainBar').append('<h1 id="Custom_MainBar_Title"></h1>');
    $('#Custom_MainBar_Title').text('MidenQuest+ v' + versionString);
    // Setup boxes
    $('#Custom_MainBar').append('<div id="Custom_MainBar_Box_Workload" class="Custom_MainBar_Box"></div>');
    $('#Custom_MainBar_Box_Workload').append('<h1>Workload Settings</h1>');
    $('#Custom_MainBar').append('<div id="Custom_MainBar_Box_Chat" class="Custom_MainBar_Box"></div>');
    $('#Custom_MainBar_Box_Chat').append('<h1>Chat Settings');
    $('#Custom_MainBar').append('<div id="Custom_MainBar_Box_Reserved" class="Custom_MainBar_Box"></div>');
    $('#Custom_MainBar_Box_Reserved').append('<h1>Reserved Settings');

    // Match the navbar size
    $('#MainPanel').css('width', '1002px');
    $('#MainPanel').css('margin-top', '0px');
    $('#MainPanel').css('height', '765px');

    $('#ZoneContent').css('border-top-left-radius', '0px');
    $('#ZoneContent').css('padding-top', '0px');
    $('#TopScreen').css('padding-top', '0px');
    $('#ZoneOptions').css('border-top-right-radius', '0px');
    // Center the text a bit better
    $('.prgActionOverlay').css('margin-top', '-19px');
    // Footer settings
    var footer = $('.aLink').parent();
    $(footer).css('border-top', '0px');
    // CSS updates
    $( "<style>#ChatLog {overflow-x: hidden;} #chatShout1 {width: 100%; padding: 2px;} #chatShout1:nth-child(even) {background: #FFF} #chatShout1:nth-child(odd) {background: #e6e6e6} </style>" ).appendTo( "head" );
  },

  load: function loadSetting() {
    var setting = localStorage.getItem('MidenQuestPlus-settings');

    try {
      setting = setting ? JSON.parse(setting) : {};
    } catch(e) {}

    setting = setting || {};

    return setting;
  },

  save: function saveSetting(settings) {
    localStorage.setItem('MidenQuestPlus-settings', JSON.stringify(settings));
  },

  // Containers in order (1 = Workload, 2 = Chat, 3 = Reserved)
  addBool: function addBoolSetting(container, name, description, defaultSetting, callback) {
    defaultSetting = settings[name] || defaultSetting;
    var AppendTo = '';

    if (container === 1) {
      AppendTo = $('#Custom_MainBar_Box_Workload');
    } else if (container === 2) {
      AppendTo = $('#Custom_MainBar_Box_Chat');
    } else if (container === 3) {
      AppendTo = $('#Custom_MainBar_Box_Reserved');
    }

    $(AppendTo).append('<div><label><input type="checkbox" name="setting-' + name + '"' + (defaultSetting ? ' checked' : '') + '>' + description + '</label></div>');
            $("input[name='setting-" + name + "']").change(function() {
                settings[name] = !settings[name];
                Settings.save(settings);

                if(callback) {
                    callback();
                }
            });
            if (settings[name] !== undefined) {
                $("input[name='setting-" + name + "']").prop("checked", settings[name]);
            } else {
                settings[name] = defaultSetting;
            }
  },

  addRadio: function addRadioSetting(container, name, description, items, defaultSettings, callback) {

  },

  addInput: function addInputSetting(container, name, description, defaultSetting, callback) {
    defaultSetting = settings[name] || defaultSetting;
    var AppendTo = '';

    if (container === 1) {
      AppendTo = $('#Custom_MainBar_Box_Workload');
    } else if (container === 2) {
      AppendTo = $('#Custom_MainBar_Box_Chat');
    } else if (container === 3) {
      AppendTo = $('#Custom_MainBar_Box_Reserved');
    }

    $(AppendTo).append('<div><label>' + description + '</label><input type="text" name="setting-' + name + '"></div>');
    $("input[name='setting-" + name + "']").prop("defaultValue", defaultSetting)
        .on("change", function() {

            settings[name] = String($(this).val());
            Settings.save(settings);

            if(callback) {
                callback();
            }
    });
    settings[name] = defaultSetting;
  },

  addButton: function(appendToID, newButtonID, description, callback, options) {

  }
};

Settings.setupUI();
var settings = Settings.load();
Settings.addBool(1, "useAlerts", "Alert when out of work", false);
Settings.addBool(2, "allowTabCycling", "Change channels with tab", false);
Settings.addInput(2, "userBackground", "User Backround Colour", "rgba(0, 180, 180, 0.2)");
Settings.addInput(2, "mentionBackground", "Mention Background Colour", "rgba(255, 165, 50, 0.5)");

// Settings Used
// Workload_useAlerts = true/false
// Chat_AllowTabCycling = true/false

/* Modify the title of the page */
    var doneAlerting = false;
    var Production = '';
    var ProductionTitle = '';
    var isWorking = false;

    var MaxWorkload = 0;
    var CurWorkLoad = 0;

    var StopWorkButton = $('#workloadStopButton');

    var CheckWork = function() {
      Production = $('.prgActionOverlay').text();
      if (Production[0] === 'S') {
        isWorking = true;
        ProductionTitle = 'Selling';
      } else if (Production[0] === 'M') {
        isWorking = true;
        ProductionTitle = 'Mining';
      } else if (Production[0] === 'G') {
        isWorking = true;
        ProductionTitle = 'Gathering';
      } else if (Production[0] === 'L') {
        isWorking = true;
        ProductionTitle = 'Cutting';
      } else if (Production[0] === 'F') {
        isWorking = true;
        ProductionTitle = 'Fishing';
      } else {
        isWorking = false;
      }

      // After the check, update the current/max workload
      if (isWorking) {
        var tempWorkload = Production.split(' ')[1].split('/');
        CurWorkLoad = tempWorkload[0];
        MaxWorkload = tempWorkload[1];
          if (doneAlerting) {
              doneAlerting = false;
          }
      }
    };

    // Little helper method for setting the title
    var UpdateTitle = function() {
      var title = '';

      if (isWorking) {
        title = ProductionTitle + ' ' + CurWorkLoad + ' / ' + MaxWorkload;
      } else {
        if (ProductionTitle) {
            if (settings.useAlerts && !doneAlerting) {

                alert(ProductionTitle + ' has stopped');
                doneAlerting = true;
            } else {
                title = ProductionTitle + ' has stopped';
            }
        } else {
          title = 'MidenQuest Online';
        }
      }

      document.title = title;
    };

    // Check what the title should be and then update it

    var titlething = setInterval(function () {
    CheckWork();
    UpdateTitle();
    }, 1000);

/* CHAT METHODS AND LOGIC GO HERE */

var protos = document.body.constructor === window.HTMLBodyElement;
var validHTMLTags  =/^(?:a|abbr|acronym|address|applet|area|article|aside|audio|b|base|basefont|bdi|bdo|bgsound|big|blink|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|isindex|kbd|keygen|label|legend|li|link|listing|main|map|mark|marquee|menu|menuitem|meta|meter|nav|nobr|noframes|noscript|object|ol|optgroup|option|output|p|param|plaintext|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|spacer|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)$/i;

function sanitize(txt) {
    var // This regex normalises anything between quotes
        normaliseQuotes = /=(["'])(?=[^\1]*[<>])[^\1]*\1/g,
        normaliseFn = function ($0, q, sym) {
            return $0.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },
        replaceInvalid = function ($0, tag, off, txt) {
            var
                // Is it a valid tag?
                invalidTag = protos &&
                    document.createElement(tag) instanceof HTMLUnknownElement
                    || !validHTMLTags.test(tag),

                // Is the tag complete?
                isComplete = txt.slice(off+1).search(/^[^<]+>/) > -1;

            return invalidTag || !isComplete ? '&lt;' + tag : $0;
        };

    txt = txt.replace(normaliseQuotes, normaliseFn)
             .replace(/<(\w+)/g, replaceInvalid);

    var tmp = document.createElement("DIV");
    tmp.innerHTML = txt;

    return "textContent" in tmp ? tmp.textContent : tmp.innerHTML;
}

var ParseChat = function(MessageContainer) {
  var Message;
  var Message_timeStamp;
  var Message_Name;
  var Message_Title;
  var Message_Title_Color;
  var Message_Text_Array;
  var Message_Text;
  var Message_Link;
  var Message_isLog = false;
  var Message_isLineBreak = false;
  var Message_isChatRemade = false;
  if (MessageContainer) {
    // Make sure the container exists first
    Message = $(MessageContainer).text();
    // Pass over quickly
    if (Message && $(MessageContainer).prop('nodeName')) {
      // Check if its a br element
      Message_isLineBreak = $(MessageContainer).prop('nodeName').toLowerCase() == 'br' ? true : false;

      if (!Message_isLineBreak) {
        // Double check
        Message_isLineBreak = Message.length > 5 ? false : true;
      }
        Message_isLog = Message.split(']')[1][0] === '[' ? false : true;

        Message_isChatRemade = $(MessageContainer).attr('new');
    }

    // If it's not a log or line break, and its unparsed, then parse:
    if (!Message_isLog && !Message_isLineBreak && Message && !Message_isChatRemade && $(MessageContainer).prop('nodeName')) {
      // Get the timestamp
      Message_timeStamp = Message.split(']')[0].substring(1);
      // Get the person sending the message
      Message_Name = Message.split(']')[2].substring(1).split(':')[0];

      // Get the users title
      Message_Title = Message.split(' ')[0].substring(8).slice(0,-1);
      // Get the users title colour
      // TODO: Get this into 1 line
      var Title_Color_Holder = $(MessageContainer).children().children()[0];
      Message_Title_Color = $(Title_Color_Holder).css('color');

      // Get the link (onclick)
      var linkContainer = $("span", MessageContainer).first();
      var theLink = $(linkContainer).children().first();
      Message_Link = $(theLink).attr('onclick');

      // Parse the message itself
      Message_Text_Array = Message.split(':');
      // If there's more than the default amount of :'s then that means a user sent 1
      if (Message_Text_Array.length > 2) {
        // Loop through each element in the array
        for (var i = 0; i < Message_Text_Array.length; i++) {
          if (i < 2) {
            // This is the stuff we don't want
          } else if (i > 2) {
            // This is what the user sent that got cut out; so add a :
            Message_Text += ":" + sanitize(Message_Text_Array[i]);
            // Can use += since it'll always be after the normal message
          } else {
            // The first part of the message
            Message_Text = sanitize(Message_Text_Array[i].substring(1));
          }
        }
      }

      // Now we have to put all this new info into an object
      var ReturnValue = {Raw: Message, TimeStamp: Message_timeStamp, Name: Message_Name, MessageText: Message_Text, MessageTitle: Message_Title, MessageTitleColor: Message_Title_Color, MessageLink: Message_Link};
      return ReturnValue;
    } else if (Message_isLog) {
      // If its a log, just mark it as 1 and return it as it is
      return {MessageText: Message_Text, isLog: true};
    } else if (Message_isChatRemade) {
      return {isParsed: true};
    } else {
      // Just mark it as a line break
      return {isLineBreak: true};
    }
  } else {
    return {noContainer: true};
  }
};

// Observer starts in GetUsername()
var ChatBox = document.querySelector('#ChatLog');

var ChatMutationHandler = function(mutations) {
  if (mutations[0].addedNodes) {
      var ChangedNodes = mutations[0].addedNodes;
      Array.prototype.forEach.call(ChangedNodes, function(mutation, i) {
          var CurrentMessage = $(mutation);
          //console.log(CurrentMessage);
          HandleChat(CurrentMessage);
      });
  } else {
    //console.log(mutations);
  }
};

// create an observer instance
var observer = new MutationObserver(ChatMutationHandler);

// configuration of the observer:
var config = { attributes: true, childList: true, characterData: true };

// Setup the username
var userName = '';
var getUsername = function() {
  userName = $('#SideName').text();
  if (userName === '???') {
    setTimeout(getUsername, 100);
  } else {
    observer.observe(ChatBox, config);
    $(ChatBox).prepend('<div id="chatShout1" style="background-color: rgb(0,155,155)" new="true"><span class="chat-timestamp"></span><span class="chat-title" style="color: rgb(155, 50, 50)">[MQ+] </span><span class="chat-name">MidenQuest+: </span><span class="chat-message">MidenQuest+ Chat Loaded</span></div>');
    Settings.addInput(2, "mentionTriggers", "Words that you want to mention", userName);
  }
}
// Give it 100 ms to load
setTimeout(getUsername, 100);

var HandleChat = function(MessageContainer) {
  var ParsedMessage = ParseChat(MessageContainer);

  if (ParsedMessage.noContainer) {
    $(MessageContainer).remove()
  } else if (ParsedMessage.isLineBreak) {
    $(MessageContainer).remove();
  } else if (ParsedMessage.isLog) {
    // Log
  } else if (ParsedMessage.isParsed) {

  } else {
    $(MessageContainer).empty();
    $(MessageContainer).attr('style', '');
    $(MessageContainer).attr('new', 'true'); // used to check if the parser should use the new 1 or the old 1
    $(MessageContainer).append('<span class="chat-timestamp">' + '[' + ParsedMessage.TimeStamp + ']' + '</span>');
    //.text(ParsedMessage.TimeStamp);
    $(MessageContainer).append('<span onclick="' + ParsedMessage.MessageLink + '" class="chat-title" style="color: ' + ParsedMessage.MessageTitleColor + '">' + '[' + ParsedMessage.MessageTitle + '] ' + '</span>');
    //.text(ParsedMessage.MessageTitle);
    $(MessageContainer).append('<span onclick="' + ParsedMessage.MessageLink + '" class="chat-name">' + ParsedMessage.Name + ': ' + '</span>');
    //.text(ParsedMessage.Name);
    $(MessageContainer).append('<span class="chat-message">' + ParsedMessage.MessageText + '</span>')
    // Check if the message was sent by you
    if (ParsedMessage.Name === userName) {
      $(MessageContainer).css('background', settings.userBackground);
      // Empty it to start working on it
    }
    // Split up the mentions
    var Triggers = settings.mentionTriggers.split(',');
    // Loop through mentions
    Triggers.forEach(function(Trigger) {
      if (ParsedMessage.MessageText.toLowerCase().indexOf(Trigger.toLowerCase()) !== -1) {

        $(MessageContainer).css('background', settings.mentionBackground);
      }
    });

  }
};

    var TabContainer = $('.Tabs>ul');
    var tabAmount = $('.Tabs>ul').children().size();
    var selectedTab = 1;

    // Create a couple helper functions
    var NextTab = function() {
        // Set what the next tab is
        if (selectedTab < 4) {
            selectedTab++;
        } else {
            selectedTab = 1;
        }

        // Switch to the next tab
        ChangeChatChannel(selectedTab);
    };

    // Handle Chat tab clicking
    $('#ChatCh1').click(function () {
      selectedTab = 1;
    });
    $('#ChatCh2').click(function () {
      selectedTab = 2;
    });
    $('#ChatCh3').click(function () {
      selectedTab = 3;
    });
    $('#ChatCh4').click(function () {
      selectedTab = 4;
    });

    // Setup the key events
    $( document ).keydown(function(e) {
        var keycode = (e.which) ? e.which : e.keyCode;
        if (keycode == 9)
        {
          // TODO: Shift + tab for PreviousTab()
          if (settings.allowTabCycling) {
            NextTab();
            e.preventDefault();
          }
        }
    });
})();

/*TODO:
*
* Allow custom chat mention phrases
* Allow for user background and mention background customization
*
* Clean up the chat everytime it's changed or restarted
*
* Use an observer for the workload (.prgActionOverlay)
*
* Use just an observer (Need to have it loop through everything)
*/
