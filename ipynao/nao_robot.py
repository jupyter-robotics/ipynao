#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Isabel Paredes.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode, Integer
from ._frontend import module_name, module_version
from time import sleep
import asyncio



class NaoRobotService():
    name = None
    widget = None
    output = None

    def __init__(self, widget, service_name):
        self.name = service_name
        self.widget = widget

    
    def create_service_msg(self, method_name, *args, **kwargs):
        data = {}
        data["command"] = "callService"
        data["service"] = str(self.name)
        data["method"]  = str(method_name)
        # convert tuple to list to avoid empty arg values
        data["args"]    = list(args)
        data["kwargs"]  = kwargs

        self.widget.send(data)

    # TODO: combine msg creating into separate function
    async def async_create_service_msg(self, method_name, *args, **kwargs):
        data = {}
        data["command"] = "callService"
        data["service"] = str(self.name)
        data["method"]  = str(method_name)
        # convert tuple to list to avoid empty arg values
        data["args"]    = list(args)
        data["kwargs"]  = kwargs

        self.widget.send(data)

        try:
            await self.widget.wait_for_change('counter')
        except Exception as e:
            return e
        return self.widget.response
        

    def __getattr__(self, method_name):
        # TODO: add error for when service is not ready
        if (method_name[:6] == "async_"):
            return lambda *x, **y: self.async_create_service_msg(method_name[6:], *x, **y)
        else:
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

    connected = Unicode("Disconnected").tag(sync=True)
    status = Unicode("Not busy").tag(sync=True)
    counter = Integer(0).tag(sync=True)
    response = None


    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.on_msg(self._handle_frontend_msg)


    def _handle_frontend_msg(self, model, msg, buffer):
        print("Received frontend msg: ", msg)
        self.response = msg


    def wait_for_change(widget, value_name):
        future = asyncio.Future()
        widget.response = None

        def get_value_change(change):
            widget.unobserve(get_value_change, names=value_name)
            if (widget.response != None):
                future.set_result(widget.response)
            else:
                future.set_result(change)    
        
        widget.observe(get_value_change, names=value_name)
        return future    


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
