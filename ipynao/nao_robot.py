#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Isabel Paredes.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode, Bool, Integer
from ._frontend import module_name, module_version
from time import sleep
import asyncio



class NaoRobotService():
    name = None
    widget = None

    def __init__(self, widget, service_name):
        self.name = service_name
        self.widget = widget

    def create_service_msg(self, method_name, *args, **kwargs):
        self.widget._response = None
        data = {}
        data["command"] = "callService"
        data["service"] = str(self.name)
        data["method"]  = str(method_name)
        # convert tuple to list to avoid empty arg values
        data["args"]    = list(args)
        data["kwargs"]  = kwargs

        self.widget.send(data)

    def __getattr__(self, method_name):
        return lambda *x, **y: self.create_service_msg(method_name, *x, **y)


class NaoRobotWidget(DOMWidget):
    """TODO: Add docstring here
    """
    _model_name = Unicode('NaoRobotModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('NaoRobotView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    value = Unicode('Hello World').tag(sync=True)
    connected = Unicode("Disconnected").tag(sync=True)
    status = Unicode("Not busy").tag(sync=True)
    synco = Unicode("test message").tag(sync=True)
    response = Unicode("").tag(sync=True)
    counter = Integer(0).tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.on_msg(self._handle_frontend_msg)
        # self.observe(self._handle_value_change, names="status")

    def _handle_frontend_msg(self, model, msg, buffer):
        print("Received frontend msg: ", msg)
        # self.response = msg

    def _handle_value_change(self, change):
        print("HANDLE HANDLE HANDLE", change)
        self.response = change['new']

    def wait_for_change(widget, value_name):
        future = asyncio.Future()

        def get_value_change(change):
            widget.unobserve(get_value_change, names=value_name)
            future.set_result(change['new'])

        widget.observe(get_value_change, names=value_name)
        return future
    
    async def set_after(self, future, delay):
       
        for i in range(25):
            print(i, " Sleep a blink > ", self.response, '< response')
            await asyncio.sleep(delay)
            if (self.response != ''):
                print("setting the future ", i)
                future.set_result(self.response)
                break

        self.response = ''       


    async def go_sleep(self, out, tSeconds=2):
        data = {}
        data["command"] = str("goSleep")
        data["tSeconds"] = tSeconds
        self.send(data)

        try:
            await self.wait_for_change('counter')
        except Exception as e:
            print('Something wrong: ', e)
            out.append_stdout('something wrong' + str(e))


        # loop = asyncio.get_running_loop()
        # future = loop.create_future()
        
        # print("Go sleep ...")
        # loop.create_task(self.set_after(future, 0.5))

        # return future
    

    def connect(self, ip_address="nao.local", port="80"):      
        data = {}
        data["command"] = str("connect")
        data["ipAddress"] = str(ip_address)
        data["port"] = str(port)
        self.send(data)


    def service(self, service_name):
        data = {}
        data["command"] = str("createService")
        data["service"] = str(service_name)
        self.send(data)
        return NaoRobotService(self, service_name)
