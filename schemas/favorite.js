const mongoose = require('mongoose');

const {Schema} = mongoose;
const favoriteSchema = new Schema({
    placId : {
        type : String,
        unique : true,
        required : true,
    },
    name : {
        type : String,
        required : true,
    },
    // location 필드는 좌표를 저장하는 필드로 경도,위도가 배열로 들어간다.
    // '2dsphere'는 위치 정보를 저장하겠다는 의미이다. 
    location : {
        type : [Number],
        index : '2dsphere',
    },
    createdAt : {
        type : Date,
        default : Date.now,
    },
});

module.exports = mongoose.model('Favorite', favoriteSchema);