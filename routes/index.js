const express = require('express');
const util = require('util');
const googleMaps =require('@google/maps');

const History = require('../schemas/history');
const Favorite =require('../schemas/favorite');

const router = express.Router();
// @google/maps 패키지로부터 구글 지도 클라이언트를 만든다. env 파일로부터 키를 가져와서 속성값으로 넣어주면 된다.
// 생성된 클라이언트에는 places, placesQueryAutoComplete, placeNearBy등의 메소드가 들어있는데 이를 활용해 API를 사용할 수 있다.
const googleMapsClient = googleMaps.createClient({
    key : process.env.PLACES_API_KEY,
});

router.get('/', (req, res, next) => {
    try {
        const favorites = await Favorite.find({});
        res.render('index', {results : favorites});
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// placeQueryAutoComplete(검색어 자동완성) API를 사용한 라우터이다.
// 라우터로부터 전달된 쿼리를 input으로 넣어주면 된다.
// 콜백 방식으로 동작하고 결과는 response.json.predictions에 담겨있다.
router.get('/autocomplete/:query', (req, res, next) => {
    googleMapsClient.placesQueryAutoComplete({
        input : req.params.query,
        language : 'ko',
    }, (err, response) => {
        if (err) {
            return next(err);
        }
        return res.json(response.json.predictions);
    });
});

// 실제 장소 검색 시 결괏값을 반환하는 라우터이다.
// 검색내역을 구현하기 위해서 DB에 검색어를 저장한다.
// 결과는 response.json.results에 담겨있다.
router.get('/search/:query', async (req, res, next) => {
    // 구글 지도 클라이언트는 콜백 방식으로 동작한다.
    // 몽구스 프로미스와 같이 사용하기 위해 util.promisify로 프로미스 패턴으로 바꿔준다.
    const googlePlaces = util.promisify(googleMapsClient.places);
    const googlePlacesNearby = util.promisify(googleMapsClient.placesNearby);
    const {lat, lng, type} = req.query;
    
    try {
        const history = new History({query : req.params.query});
        await history.save();

        let response;

        // 쿼리스트링으로 lat과 lng이 제공되면 placeNearby API를 사용한다.
        if (lat && lng) {
            response = await googlePlacesNearby({
                keyword : req.params.query, // 찾을 검색어
                location : `${lat},${lng}`, // 위도,경도
                rankby : 'distance', // 정렬순서
                language : 'ko', // 검색언어
                type,
            //  radius : 5000 // 검색 반경 내 인기순 정렬
            });
        } else {
            response = await googlePlaces({
                query : req.params.query,
                language : 'ko',
                type,
            });
        }

        res.render('result', {
            title : `${req.params.query} 검색 결과`,
            results : response.json.results,
            query : req.params.query,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
});

router.post('/location/:id/favorite', async (req, res, next) => {
    try {
        const favorite = await Favorite.create({
            plcasId : req.params.id,
            name : req.body.name,
            location : [req.body.lng, req.body,lat],
        });

        res.send(favorite);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router;