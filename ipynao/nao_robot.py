#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Isabel Paredes.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode, Integer, Bool
from ._frontend import module_name, module_version

import asyncio

def wait_for_change(widget, value):
    """
    Wait for a change in a widget's value.
    """
    future = asyncio.Future()

    def getvalue(change):
        # make the new value available
        future.set_result(change.new)
        widget.unobserve(getvalue, value)

    widget.observe(getvalue, value)
    return future


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
    counter = Integer(0, read_only=True).tag(sync=True)
    connected = Bool(False).tag(sync=True)

    async def connect(self, ip_address="nao.local"):
        self.value = "Connecting..."
        data = {}
        data["command"] = str("connect")
        data["ipAddress"] = str(ip_address)
        self.send(data)

        # TODO: figure out async
        # await wait_for_change(self, "counter")
        self.connected = True
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