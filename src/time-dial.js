/* Open-sourced licensed MIT 2017 by Jeremy Nicoll
 * look for updated code at http://github.com/eltiare */

import fecha from 'fecha';

export default class TimeDial {

  constructor(dateTime, format) {
    if (dateTime) {
      if (typeof dateTime.daysInMonth == 'function') {
        this.dateTime = dateTime.toDate();
      } else if (typeof dateTime.getMonth == 'function') {
        this.dateTime = dateTime;
      } else if (typeof dateTime == 'string') {
        this.dateTime = format ? fecha.parse(dateTime, format) : Date.parse(dateTime);
      } else {
        throw "Unrecognized date object: " + dateTime;
      }
    } else {
      this.dateTime = new Date();
    }
  }

  add(number, measurement) {
    let args = this._toArray(), [ offset, multiplier ] = this._getOffsetMultiplier(measurement);
    args[offset] += number * multiplier;
    let newDate = this._makeDate(args);
    // Check to make sure we didn't accidentally invoke a month wrap-around
    if (
      args[2] > 28 &&
      ['m', 'month', 'months', 'y', 'year', 'years'].indexOf(measurement) !== -1 &&
      args[2] != newDate.getDate()
    )  {
      let newArgs = this._toArray(newDate);
      newArgs[1] -= 1;
      newArgs[2] = this.daysInMonth(newArgs[0], newArgs[1]);
      newDate = this._makeDate(newArgs);
    }
    return new TimeDial(newDate);
  }

  subtract(number, measurement) {
    return this.add(-number, measurement);
  }

  set(obj, date) {
    let dateArgs = this._toArray(date);
    for (let k in obj) {
      if ( !obj.hasOwnProperty(k) ) continue;
      let [ offset, multiplier ] = this._getOffsetMultiplier(k);
      if (multiplier == 7) throw 'Cannot "set" a week. That does not make sense.';
      dateArgs[offset] = obj[k];
    }
    return new TimeDial(this._makeDate(dateArgs));
  }

  startOf(measurement, date) {
    let arr = this._toArray(date),
      [ offset, multiplier ] = this._getOffsetMultiplier(measurement);
    switch(offset) {
      // Fall through is intentional here to avoid code duplication
      case 0:  // year
        arr[1] = 1;
      case 1: // month
        arr[2] = 1;
      case 2: // day or week
        if ( multiplier == 7 ) // week
          arr[2] -= (date || this).getDay();
        arr[3] = 0;
      case 3: // hour
        arr[4] = 0;
      case 4: // minute
        arr[5] = 0;
      case 5: // second
        arr[6] = 0;
    }
    return new TimeDial( this._makeDate(arr) );
  }

  endOf(measurement, date) {
    let arr = this._toArray(date),
      [ offset, multiplier ] = this._getOffsetMultiplier(measurement);
    switch(offset) {
      // Fall through is intentional here to avoid code duplication
      case 0:  // year
        arr[1] = 12;
      case 1: // month
        arr[2] = this.daysInMonth(date && date.getFullYear(), date && date.getMonth());
      case 2: // day or week
        if ( multiplier == 7 ) // week
          arr[2] += 6 - (date || this).getDay();
        arr[3] = 23;
      case 3: // hour
        arr[4] = 59;
      case 4: // minute
        arr[5] = 59;
      case 5: // second
        arr[6] = 999;
    }
    return new TimeDial( this._makeDate(arr) );
  }

  eq(date) {
    return date && this.getTime() == date.getTime();
  }

  gt(date) {
    return date && this.getTime() > date.getTime();
  }

  gte(date) {
    return date && this.getTime() >= date.getTime();
  }

  lt(date) {
    return date && this.getTime() < date.getTime();
  }

  lte(date) {
    return date && this.getTime() <= date.getTime();
  }

  format(format) {
    return fecha.format(this.dateTime, format);
  }

  toDate() {
    return this.dateTime;
  }

  daysInMonth(year, month) {
    return new Date(
      year ||  this.dateTime.getFullYear(),
      ( month || this.dateTime.getMonth() ) + 1,
      0).getDate();
  }

  // Private functions, use at your own risk!

  _makeDate(args) {
    args = [null].concat(args);
    return new ( Function.prototype.bind.apply(Date, args) )();
  }

  _toArray(date) {
    let d = date || this.dateTime;
    return [
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    ];
  }

  _getOffsetMultiplier(measurement) {
    let offset = null;
    switch(measurement) {
      case 'y': case 'year': case 'years':
        return [0, 1];
      case 'm': case 'month': case 'months':
        return [1, 1];
      case 'w': case 'week': case 'weeks':
        return [2, 7];
      case 'd': case 'day': case 'days':
        return [2, 1];
      case 'H': case 'hour': case 'hours':
        return [3, 1];
      case 'M': case 'minute': case 'minutes':
        return [4, 1];
      case 'S': case 'second': case 'seconds':
        return [5, 1];
      case 'MS': case 'millsecond': case 'milliseconds':
        return [6, 1];
      default:
        throw "Invalid measurement passed: " + measurement;
    }
  }

}

// Shim getter methods to underlying date object
['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds']
  .forEach( measure => {
    let methods = ['get' + measure, 'getUTC' + measure ];
    methods.forEach( methodName => {
      TimeDial.prototype[methodName] = function() { return this.dateTime[methodName]() };
    });
  } );

TimeDial.prototype.getTimezoneOffset = function() { return this.dateTime.getTimezoneOffset(); }
TimeDial.prototype.getTime = function() { return this.dateTime.getTime(); }
