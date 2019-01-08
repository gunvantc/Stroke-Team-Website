var mongoose = require("mongoose");
var Schema = mongoose.Schema;


var preferenceSchema = new mongoose.Schema({
	member: { type: Schema.Types.ObjectId, ref: 'User'},
	color: {type: String, enum: ['green','red']},
	week: Number,
	day: Number,
	quarter: {
		season: String,
		year: Number
	},
    sTime: String,
    duration: String,
    comment: String
});

preferenceSchema.virtual("arrangedData").get(function() {
	return [this.color.substring(0,1), (''+ this.day) , this.sTime, this.duration, this.comment, this._id];
});

module.exports = mongoose.model("preference", preferenceSchema);