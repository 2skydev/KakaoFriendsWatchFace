/*
* Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

(function() {
  Number.prototype.zeroPad = String.prototype.zeroPad = function() {
    return ('0' + this).slice(-2)
  }

  var timerUpdateDate = 0,
    battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery,
    interval,
    shortDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    shortMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    fullMonth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /**
   * Updates the date and sets refresh callback on the next day.
   * @private
   * @param {number} prevDay - date of the previous day
   */
  function updateDate(prevDay) {
    var datetime = tizen.time.getCurrentDateTime(),
      nextInterval,
      getDay = datetime.getDay(),
      getDate = datetime.getDate(),
      getMonth = datetime.getMonth();

    // Check the update condition.
    // if prevDate is '0', it will always update the date.
    if (prevDay !== null) {
      if (prevDay === getDay) {
        /**
         * If the date was not changed (meaning that something went wrong),
         * call updateDate again after a second.
         */
        nextInterval = 1000;
      } else {
        /**
         * If the day was changed,
         * call updateDate at the beginning of the next day.
         */
        // Calculate how much time is left until the next day.
        nextInterval =
          (23 - datetime.getHours()) * 60 * 60 * 1000 +
          (59 - datetime.getMinutes()) * 60 * 1000 +
          (59 - datetime.getSeconds()) * 1000 +
          (1000 - datetime.getMilliseconds()) +
          1;
      }
    }

    document.getElementById('day').innerHTML = getDate.zeroPad();
    document.getElementById('month').innerHTML = fullMonth[getMonth];

    // If an updateDate timer already exists, clear the previous timer.
    if (timerUpdateDate) {
      clearTimeout(timerUpdateDate);
    }

    // Set next timeout for date update.
    timerUpdateDate = setTimeout(function() {
      updateDate(getDay);
    }, nextInterval);
  }

  /**
   * Updates the current time.
   * @private
   */
  function updateTime() {
    var datetime = tizen.time.getCurrentDateTime()
    var hours = datetime.getHours()

    if (hours > 12) hours -= 12

    document.getElementById("hours").innerHTML = hours.zeroPad()
    document.getElementById("minutes").innerHTML = datetime.getMinutes().zeroPad()
  }

  /**
   * Sets to background image as BACKGROUND_URL,
   * and starts timer for normal digital watch mode.
   * @private
   */
  function initDigitalWatch() {
    document.getElementById("digital-body").style.backgroundImage = "./images/bg.jpg";
    interval = setInterval(updateTime, 500);
  }

  /**
   * Clears timer and sets background image as none for ambient digital watch mode.
   * @private
   */
  function ambientDigitalWatch() {
    clearInterval(interval);
    document.getElementById("digital-body").style.backgroundImage = "none";
    updateTime();
  }

  /**
   * Gets battery state.
   * Updates battery level.
   * @private
   */
  function getBatteryState() {
    document.getElementById('battery-path').style.strokeDasharray = 25 * (battery.level * 100) / 100 + ', 100'
  }

  /**
   * Updates watch screen. (time and date)
   * @private
   */
  function updateWatch() {
    updateTime();
    updateDate(0);
  }

  /**
   * Binds events.
   * @private
   */
  function bindEvents() {
    // add eventListener for battery state
    battery.addEventListener("chargingchange", getBatteryState);
    battery.addEventListener("chargingtimechange", getBatteryState);
    battery.addEventListener("dischargingtimechange", getBatteryState);
    battery.addEventListener("levelchange", getBatteryState);

    // add eventListener for timetick
    window.addEventListener("timetick", function() {
      ambientDigitalWatch();
    });

    // add eventListener for ambientmodechanged
    window.addEventListener("ambientmodechanged", function(e) {
      if (e.detail.ambientMode === true) {
        // rendering ambient mode case
        ambientDigitalWatch();
        
      } else {
        // rendering normal digital mode case
        initDigitalWatch();
      }
    });

    // add eventListener to update the screen immediately when the device wakes up.
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) {
        updateWatch();
      }
    });

    // add event listeners to update watch screen when the time zone is changed.
    tizen.time.setTimezoneChangeListener(function() {
      updateWatch();
    });
  }

  /**
   * Initializes date and time.
   * Sets to digital mode.
   * @private
   */
  function init() {
    initDigitalWatch();
    updateDate(0);

    bindEvents();
  }

  window.onload = init();
}());
