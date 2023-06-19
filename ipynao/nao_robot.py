#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Isabel Paredes.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode, Bool
from ._frontend import module_name, module_version

import asyncio


class NaoRobotService():
    name = None
    widget = None

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

    def __getattr__(self, method_name):
        # TODO: some very basic input validation (maybe)
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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.on_msg(self._handle_frontend_msg)

    def _handle_frontend_msg(self, model, msg, buffer):
        print("Received frontend msg: ")
        print(msg)
        # TODO:

    def wait_for_change(widget, value_name):
        future = asyncio.Future()

        def get_value_change(change):
            widget.unobserve(get_value_change, names=value_name)
            future.set_result(change['new'])

        widget.observe(get_value_change, names=value_name)
        return future


    async def go_sleep(self, tSeconds=2):
        data = {}
        data["command"] = str("goSleep")
        data["tSeconds"] = tSeconds
        self.send(data)

        return self.wait_for_change("synco")
    

    def connect(self, ip_address="nao.local", port="80"):      
        data = {}
        data["command"] = str("connect")
        data["ipAddress"] = str(ip_address)
        data["port"] = str(port)
        self.send(data)


    def service(self, service_name):
        return NaoRobotService(self, service_name)
