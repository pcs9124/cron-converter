'use strict';

var _ = require('lodash');

/**
 * Creates an instance of Range.
 * Range objects represent a collection of positive integers.
 *
 * @constructor
 * @this {Range}
 * @param {string} rangeString The string to be parsed as a range.
 * @param {object} unit The unit of measurement of time (see units.js).
 */
function Range(rangeString, unit, step) {
  this.unit = unit;
  step = step || 1;
  if (unit.alt) {
    rangeString = rangeString.toUpperCase();
    for (var i = 0; i < unit.alt.length; i++) {
      rangeString = rangeString.replace(unit.alt[i], i + unit.min);
    }
  }
  var parsedValues;
  if (rangeString === '*') {
    parsedValues = _.range(unit.min, unit.max + 1);
  } else {
    var parsed = _.map(rangeString.split(','), function(part) {
      var subparts = part.split('-');
      if (subparts.length === 1) {
        var value = parseInt(subparts[0], 10);
        if (isNaN(value)) {
          throw new Error('Invalid value');
        }
        return [value];
      } else if (subparts.length === 2) {
        var minValue = parseInt(subparts[0], 10);
        var maxValue = parseInt(subparts[1], 10);
        if (maxValue <= minValue) {
          throw new Error(
            'Range syntax error: max range is less than min range'
          );
        }
        return _.range(minValue, maxValue + 1);
      } else {
        throw new Error('Range syntax error');
      }
    });
    parsedValues = _.sortBy(_.union(_.flatten(parsed)));
    var first = parsedValues[0];
    var last = parsedValues[parsedValues.length - 1];
    if (first < unit.min || last > unit.max) {
      throw new Error('Value out of range');
    }
  }
  // Apply interval step
  if (step > 1) {
    parsedValues = parsedValues.filter(function(value) {
      return value % step === 0;
    });
    if (!parsedValues.length) {
      throw new Error('Empty interval value');
    }
  }
  this.values = parsedValues;
}

/**
 * Returns the smallest value in the range.
 *
 * @this {Range}
 * @return {number} The smallest value.
 */
Range.prototype.min = function() {
  return this.values[0];
};

/**
 * Returns the largest value in the range.
 *
 * @this {Range}
 * @return {number} The largest value.
 */
Range.prototype.max = function() {
  return this.values[this.values.length - 1];
};

/**
 * Returns true if range has all the values of the unit.
 *
 * @this {Range}
 * @return {boolean} true/false.
 */
Range.prototype.isFull = function() {
  return this.values.length === this.unit.max - this.unit.min + 1;
};

/**
 * Returns the difference between first and second elements in the range.
 *
 * @this {Range}
 * @return {boolean} true/false.
 */
Range.prototype.getStep = function() {
  if (this.values.length > 2) {
    var step = this.values[1] - this.values[0];
    if (step > 1) {
      return step;
    }
  }
};

/**
 * Returns true if the range can be represented as an interval.
 *
 * @this {Range}
 * @return {boolean} true/false.
 */
Range.prototype.isInterval = function(step) {
  for (var i = 1; i < this.values.length; i++) {
    var prev = this.values[i - 1];
    var value = this.values[i];
    if (value - prev !== step) {
      return false;
    }
  }
  return true;
};

/**
 * Returns true if the range contains all the interval values.
 *
 * @this {Range}
 * @return {boolean} true/false.
 */
Range.prototype.isFullInterval = function(step) {
  var unit = this.unit;
  var min = this.min();
  var max = this.max();
  var haveAllValues = this.values.length == (max - min) / step + 1;
  if (min - step < unit.min && max + step > unit.max && haveAllValues) {
    return true;
  }
  return false;
};

/**
 * Returns the range as an array of integers.
 *
 * @this {Range}
 * @return {array} The range as an array.
 */
Range.prototype.toArray = function() {
  return this.values;
};

/**
 * Returns the range as a string.
 *
 * @this {Range}
 * @return {string} The range as a string.
 */
Range.prototype.toString = function() {
  if (this.isFull()) {
    return '*';
  }
  var step = this.getStep();
  if (step && this.isInterval(step)) {
    if (this.isFullInterval(step)) {
      return '*/' + step;
    } else {
      return this.min() + '-' + this.max() + '/' + step;
    }
  } else {
    var retval = [];
    var startRange = null;
    _.forEach(this.values, function(value, index, self) {
      if (value !== self[index + 1] - 1) {
        if (startRange !== null) {
          retval.push(startRange + '-' + value);
          startRange = null;
        } else {
          retval.push(value);
        }
      } else if (startRange === null) {
        startRange = value;
      }
    });
    return retval.join(',');
  }
};

module.exports = Range;
