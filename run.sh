#!/usr/bin/env bash

wt create hn_bot.js
curl https://wt-31e5ed6890208cb2678f2eb2f4ccc3f9-0.run.webtask.io/hn_bot | sed "s|\\\n|\n|g"