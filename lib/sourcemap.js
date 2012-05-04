function SourceMap(data) {
	data = JSON.parse(data);
	this.sources = data.sources;
	this.names = data.names;
	this.version = data.version;
	this.sourceRoot = data.sourceRoot;
	this.file = data.file;
	
	this.groups = data.mappings.split(';').map(function(group) {
		return group.split(',').map(function(segment) {
			segment = decodeVLQStr(segment);
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
		
		for(var k = 0; k < groups.length; k++) {
			var segments = groups[k];
			for(var i = 0; i < segments.length; i++) {
				var segment = segments[i];
				var enderline = segment.field3;
				
				for(var j = 0; j < sources.length; j++) {
					var current = offsetMap[sources[j]];
					var next = offsetMap[sources[j + 1]] || Infinity; // It had better match...
					
					if(enderline >= current && enderline <= next) {
						segment.field3 -= current;
						segment.field2 = j;
					}
				}
			}
		}
	},
	serialize: function() {
		var mappings = this.groups.map(function(group) {
			return group.map(function(segment) {
				var r = [];
				var len = Object.keys(segment).length;
				for(var i = 0; i < len; i++) {
					r.push(segment['field' + (i + 1)]);
				}
				return encodeVLQArr(r);
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