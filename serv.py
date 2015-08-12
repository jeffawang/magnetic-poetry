#!/usr/bin/env python

import os

import tornado.web

from tornado.ioloop import IOLoop
from tornado.concurrent import Future
from tornado import gen
from tornado.web import url
from tornado.httpserver import HTTPServer

from optparse import OptionParser

def parse_options():
    parser = OptionParser()
    #parser.add_option("-z", "--zk_addr", action="store")
    parser.add_option("-d", "--debug", action="store_true", default=False)
    return parser.parse_args()

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

if __name__ == "__main__":
    opts, args = parse_options()

    application = tornado.web.Application([
            url(r"/", MainHandler),
            #url(r"/zk", ZooPathHandler, dict(zk_addr=opts.zk_addr), name="zk")
            url(r"/js/(.*)", tornado.web.StaticFileHandler, {"path": 'js'}),
            url(r"/data/(.*)", tornado.web.StaticFileHandler, {"path": 'data'}),
            url(r"/css/(.*)", tornado.web.StaticFileHandler, {"path": 'css'})
        ],
        debug=opts.debug,
        template_path="views")

    server = HTTPServer(application)

    server.listen(2222)
    IOLoop.instance().start()
