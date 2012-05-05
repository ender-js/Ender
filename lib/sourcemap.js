function SourceMap(data) {
	data = JSON.parse(data);
	this.sources = data.sources;
	this.names = data.names;
	this.version = data.version;
	this.sourceRoot = data.sourceRoot;
	this.file = data.file;
	
	var prev = [0, 0, 0, 0, 0];
	this.groups = data.mappings.split(';').map(function(group) {
		prev[0] = 0;
		return group.split(',').map(function(segment) {
			segment = decodeVLQStr(segment);
			
			segment = segment.map(function(v, i) { // Stabby function would really help here
				return v + prev[i];
			});
			prev = prev.map(function(v, i) {
				v = segment[i];
				return (v != null && !isNaN(v)) ? v : prev[i];
			});
			
			var r = {};
			for(var i = 0; i < segment.length; i++) {
				r['field' + (i + 1)] = segment[i];
			}
			return r;
		});
	});
}
SourceMap.prototype = {
	translate: function(offsetMap) {
		var sources = this.sources = Object.keys(offsetMap);
		var groups = this.groups;
		var self = this;
		
		sources.forEach(function(sourceName, sourceIndex) {
			var source = offsetMap[sourceName];
			var offset = source.offset;
			var lines = source.lines;
			
			groups.forEach(function(segments, minline) {
				segments.forEach(function(segment) {
					if(segment.field3 == null) {
						return;
					}
					var tmp = segment.field3 - offset;
					if(tmp >= 0 && tmp < lines) {
						//console.log(sourceName, offset, lines, tmp + ' <- ' + segment.field3, (self.names[segment.field5] || segment.field5) + ' <- ' + segment.field4);
						segment.field3 = tmp;
						segment.field2 = sourceIndex;
					}
				});
			});
		});
	},
	serialize: function() {
		var prev = [0, 0, 0, 0, 0];
		var mappings = this.groups.map(function(group) {
			prev[0] = 0;
			return group.map(function(segment) {
				var r = [];
				var len = Object.keys(segment).length;
				for(var i = 0; i < len; i++) {
					r.push(segment['field' + (i + 1)]);
				}
				segment = r;
				
				var saved = segment;
				segment = segment.map(function(v, i) {
					return v - prev[i];
				});
				prev = saved.map(function(v, i) {
					return (v != null && !isNaN(v)) ? v : prev[i];
				});
				
				return encodeVLQArr(segment);
			}).join(',');
		}).join(';');
		
		return JSON.stringify({
			version: this.version,
			file: this.file,
			sourceRoot: this.sourceRoot,
			sources: this.sources,
			names: this.names,
			mappings: mappings
		});
	}
}


var iToB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
var bToI = {};
iToB.forEach(function(v, i) {
	bToI[v] = i;
});

function encodeVLQArr(values) {
	return values.map(function(v) {
		return encodeVLQ(v);
	}).join('');
}
function encodeVLQ(aValue) {
	var encoded = '';
	var vlq = toVLQSigned(aValue);
	var sign = aValue < 0 ? 1 : 0;
	
	do {
		var digit = vlq & 31; // Mask to first 5 bits
		vlq >>>= 5; // Remove the first 5 bits
		if(vlq > 0) {
			digit |= 32; // Set sixth bit
		}
		encoded += iToB[digit];
	} while(vlq > 0);
	
	return encoded;
}
function toVLQSigned(aValue) {
	return aValue < 0 ? ((-aValue) << 1) | 1 : (aValue << 1);
}

function decodeVLQStr(str) {
	var r = [];
	while(str.length > 0) {
		var t = decodeVLQ(str);
		r.push(t.value);
		str = t.rest;
	}
	return r;
}
function decodeVLQ(aStr) {
	var i = 0;
	var result = 0;
	var shift = 0;
	var continuation;
	
	do {
		if(i >= aStr.length) {
			throw new Error('Expected more digits in base 64 VLQ value.');
		}
		
		var digit = bToI[aStr[i++]];
		continuation = digit >>> 5;
		digit &= 31;
		result |= digit << shift;
		shift += 5;
	} while(continuation);
	
	return {value: fromVLQSigned(result), rest: aStr.slice(i)};
}
function fromVLQSigned(aValue) {
	var shifted = aValue >>> 1;
	return (aValue & 1) ? -shifted : shifted;
}

module.exports = SourceMap;