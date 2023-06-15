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

# TODO: figure out async
import asyncio

# def wait_for_change(widget, value):
#     """
#     Wait for a change in a widget's value.
#     """
#     future = asyncio.Future()

#     def getvalue(change):
#         # make the new value available
#         future.set_result(change.new)
#         widget.unobserve(getvalue, value)

#     widget.observe(getvalue, value)
#     return future

def create_service_msg(service_name, method_name, *args, **kwargs):
    data = {}
    data["command"] = "callService"
    data["service"] = str(service_name)
    data["method"]  = str(method_name)
    data["args"]    = args
    data["kwargs"]  = kwargs
    return data

class NaoRobotService():
    name = None

    def __init__(self, service_name):
        self.name = service_name

    def __getattr__(self, method_name):
        # TODO: some very basic input validation (maybe)
        return lambda *x, **y: create_service_msg(self.name, method_name, *x, **y)


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
    synco = Integer(0, read_only=True).tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.on_msg(self._handle_frontend_msg)

    def _handle_frontend_msg(self, model, msg, buffer):
        print("Received frontend msg: ")
        print(msg)
        # TODO:

    def wait_for_change(self, value_name):
        future = asyncio.Future()
        print("CREATED A FUTURE")

        def get_value_change(change):
            print("GOT NEW VALUE")
            self.unobserve(get_value_change, value_name)
            future.set_result(change['new'])

        self.observe(get_value_change, value_name)

        print("RETURNING THE FUTURE")
        return future

    async def wait_for_me(self, tSeconds=2):
        print("STARTING TO WAIT")
        data = {}
        data["command"] = str("goSleep")
        data["tSeconds"] = tSeconds
        self.send(data)
        print("SENT THE DATA")

        await self.wait_for_change("synco")

        print("RETURNING THE WAIT")
        return "something"
    
    async def wait_wrapper(self, tSeconds=2):
        print("WRAPPER")
        nap = self.wait_for_me(tSeconds)
        await nap
        return "doneskies"


    def testing(self):
        self.value = "Testing..."
        data = {}
        data["command"] = str("Testing")
        self.send(data)
        print("After sent")
        self.value = "Done testing"

    def connect(self, ip_address="nao.local"):
        self.value = "Connecting..."
       
        data = {}
        data["command"] = str("connect")
        data["ipAddress"] = str(ip_address)
        self.send(data)

        self.value = "Connected."

    def service(self, service_name):
        return NaoRobotService(service_name)

    def ALTextToSpeech(self, text):
        if (self.connected):
            data = {}
            data["command"] = str("ALTextToSpeech")
            data["speech"] = str(text)
            self.send(data)
        else:
            self.value = "Not connected"

    def ALLeds(self, seconds):
        data = {}
        data["command"] = str("ALLeds")
        data["tSeconds"] = seconds
        self.send(data)

    def ALMotion(self):
        data = {}
        data["command"] = str("ALMotion")
        self.send(data)