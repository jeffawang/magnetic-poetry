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

class AsyncZoo(object):
    def __init__(self, zk_addr):
        self.__client = kazoo.client.KazooClient(hosts=zk_addr)
        self.__client.start()

    def futurize(func):
        def futurized(*args, **kwargs):
            future = Future()
            def async_callback(f):
                try:
                    future.set_result(f.get())
                except Exception, e:
                    future.set_exception(e)
            kwargs['future'] = future
            kwargs['callback'] = async_callback
            return func(*args, **kwargs)
        return futurized

    @futurize
    def get_children(self, path, future, callback):
        children = self.__client.get_children_async(path)
        children.rawlink(callback)
        return future

    @futurize
    def get(self, path, future, callback):
        nodecontent = self.__client.get_async(path)
        nodecontent.rawlink(callback)
        return future

    @futurize
    def exists(self, path, future, callback):
        nodecontent = self.__client.exists_async(path)
        nodecontent.rawlink(callback)
        return future

class ZooPathHandler(tornado.web.RequestHandler):
    def initialize(self, zk_addr):
        self.azoo = AsyncZoo(zk_addr)

    @gen.coroutine
    def get(self):
        # get_arguments will return [] if not present (evals to false)
        #               will return [u''] if present (evals to true)
        return_json = self.get_arguments("json")
        zkpath = os.path.normpath(self.get_query_argument("path"))
        paths = self.component_paths(zkpath)
        request = self.request
        path = request.path
        try:
            children, content = yield [self.azoo.get_children(zkpath), self.azoo.get(zkpath)]
        except kazoo.client.NoNodeException, e:
            self.set_status(404)
            self.write("Requested node doesn't exist: %s" % zkpath)
            return
        if return_json:
            self.write({"children": children, "content": content[0]})
        else:
            self.render("zk_children.stpl", nodes=children, zkpath=zkpath, path=path, paths=paths, nodecontent=content)

    def component_paths(self, path):
        elems = path.split(os.path.sep)[1:]
        currpath = "/"
        paths = []
        for i in elems:
            currpath = os.path.join(currpath, i)
            paths.append((i, currpath))
        return paths

    def write_error(self, status_code, **kwargs):
        self.write("Faildogs! %s!" % status_code)
        self.write("<br/>%s<br/>%s<br/><pre>%s</pre>" % kwargs['exc_info'])

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html")

if __name__ == "__main__":
    opts, args = parse_options()

    application = tornado.web.Application([
            url(r"/", MainHandler),
            #url(r"/zk", ZooPathHandler, dict(zk_addr=opts.zk_addr), name="zk")
            url(r"/js/(.*)", tornado.web.StaticFileHandler, {"path": 'js'}),
            url(r"/data/(.*)", tornado.web.StaticFileHandler, {"path": 'data'})
        ],
        debug=opts.debug,
        template_path="views")

    server = HTTPServer(application)

    server.listen(2222)
    IOLoop.instance().start()
