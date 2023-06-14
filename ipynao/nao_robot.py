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
            future.set_result(change.new)
            self.unobserve(get_value_change, value_name)

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

        return self.wait_for_change("synco")

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