return function(context, cb) {
var code =
`
import urllib2
from  urllib import urlencode
from datetime import datetime,timedelta
import json


class HnApi:
    HN_API = 'https://hacker-news.firebaseio.com/v0'

    def __init__(self):
        self.client = urllib2.build_opener()

    def _request(self, query):
        req = urllib2.Request('{host}{query}'.format(host=self.HN_API, query=query))
        raw_response = self.client.open(req)
        response = json.load(raw_response)
        return response

    def item(self, item):
        q = '/item/{item}.json'.format(item=item)
        item = self._request(q)
        item['datetime'] = datetime.fromtimestamp(int(item['time']))
        return item

    def topstories(self):
        q = '/topstories.json'
        top = self._request(q)
        return top

    def newstories(self):
        q = '/newstories.json'
        top = self._request(q)
        return top

    def get_daily_trends(self, cut_score=50):
        trends = []
        news = self.newstories()
        tops = self.topstories()
        for item_id in news:
            if item_id in tops:
                item = self.item(item_id)
                if 'url' in item.keys() and datetime.today()-item['datetime'] < timedelta(days=1) and item['score'] > cut_score:
                    trends.append(item)
        sorted_trends = sorted(trends, key=lambda k: k['score'])
        return sorted_trends


class TelegramApi:
    TG_API = 'https://api.telegram.org/bot'

    def __init__(self, chat_id, token):
        self.token = token
        self.chat_id = chat_id
        self.client = urllib2.build_opener()

    def sendmessage(self, message, parse_mode):
        data = urlencode(dict(
            text=message,
            chat_id=self.chat_id,
            parse_mode=parse_mode

        ))
        req = urllib2.Request('{host}{token}/sendMessage'.format(
            host=self.TG_API,
            token=self.token
        ))

        req.add_data(data=data)

        raw_response = self.client.open(req)
        response = json.load(raw_response)
        return response


if __name__ == '__main__':

    hn = HnApi()
    tg = TelegramApi(chat_id='@hn_chan', token='')

    for item in hn.get_daily_trends(cut_score=200)[0:10]:
        message = u'''
    *{time}* [Comments({cmnts})](https://news.ycombinator.com/item?id={id}) *score({score})* [{title}]({url})
        '''.format(
            title=item['title'].encode('ascii', 'ignore'),
            url=item['url'],
            score=item['score'],
            time=item['datetime'].strftime('%Y-%m-%d %H:%M'),
            cmnts=item['descendants'],
            id=item['id']
        )
        tg.sendmessage(message=message, parse_mode='Markdown')
`;
    require('child_process').exec('python -c "' + code + '"', function(err, out) {
    cb(err, out);
  });
};