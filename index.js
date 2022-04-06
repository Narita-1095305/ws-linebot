'use strict';

const express = require('express');
const app = express();

const util = require('util');

const line = require('@line/bot-sdk');
// Bot用情報
const config = {
  channelSecret: "c7accec3941957074585f4a1b57bdff6",
  channelAccessToken: "DjEgcZETEs6EtOTctLZz3xSoKVRN2XctVqfndXduzkXN2p6wfwgnHfDMvD3RtZzgtuZhq92Q8gmTyi8411WrpGeBhrJyXz1JJR3zHF7ctkENXkxlbrxtrIOWp71hJmo4+JELNqv4+FAwrMAaoS51SAdB04t89/1O/w1cDnyilFU=",
};
const client = new line.Client(config);

// LINE Botからのアクセスの一次処理。
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// イベントに対する返答を記述する部分
function handleEvent(event) {
  // ユーザーからBotにテキストが送られた場合以外は何もしない
  if (event.type !== 'message' || event.message.type !== 'location') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // ユーザーからBotにテキストが送られた場合のみ以下が実行される
  const request = require('sync-request');
  const url = util.format('https://map.yahooapis.jp/search/local/V1/localSearch?appid=dj00aiZpPWYxZmFKTVVVUklUayZzPWNvbnN1bWVyc2VjcmV0Jng9YmI-&lat=%s&lon=%s&dist=3&output=json', event.message.latitude, event.message.longitude);
  const res = request('GET', url);
  const result = JSON.parse(res.getBody('utf8'));
  const restaurants = result.Feature

  var eachRestaurantLayoutTemplate = {
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": "https://linecorp.com",
      "size": "full",
      "aspectRatio": "2:1",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [{
          "type": "text",
          "text": "Name",
          "weight": "bold",
          "size": "xl"
        },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "lg",
          "spacing": "sm",
          "contents": [{
              "type": "box",
              "layout": "baseline",
              "spacing": "sm",
              "contents": [{
                  "type": "text",
                  "text": "住所",
                  "color": "#aaaaaa",
                  "size": "sm",
                  "flex": 1
                },
                {
                  "type": "text",
                  "text": "Address",
                  "wrap": true,
                  "color": "#666666",
                  "size": "sm",
                  "flex": 3
                }
              ]
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "style": "link",
          "height": "sm",
          "action": {
            "type": "uri",
            "label": "経路",
            "uri": "https://linecorp.com"
          }
        },
        {
          "type": "spacer",
          "size": "sm"
        }
      ],
      "flex": 0
    }
  }

  var restaurantsLayout = []
  restaurants.forEach(function(restaurant) {
    var eachRestaurantLayout = JSON.parse(JSON.stringify(eachRestaurantLayoutTemplate));
    if(restaurant.Property.LeadImage != undefined) {
      eachRestaurantLayout.body.contents[0].text = restaurant.Name;
      eachRestaurantLayout.body.contents[1].contents[0].contents[1].text = restaurant.Property.Address;
      eachRestaurantLayout.hero.url = restaurant.Property.LeadImage.replace('http://', 'https://')
      eachRestaurantLayout.footer.contents[0].action.uri = util.format('https://www.google.com/maps?q=%s,%s', restaurant.Geometry.Coordinates.split(',')[1], restaurant.Geometry.Coordinates.split(',')[0])
      restaurantsLayout.push(eachRestaurantLayout)
    }
  });
  var carousel = {
    "type": "carousel",
    "contents": restaurantsLayout
  }

  const echo = {
    'type': 'flex',
    'altText': '検索結果',
    'contents': carousel
  }
  
  // 返信
  return client.replyMessage(event.replyToken, echo);
}

// Webアプリケーションを開始
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});