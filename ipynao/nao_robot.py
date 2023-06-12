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

import asyncio


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
    counter = Integer(0).tag(sync=True) # TODO: readonly

    # def send(self, command, args):
    #     data = {}
    #     data["command"] = str(command)
    #     data["args"] = args
    #     print("SENDING CMD>>>>>>>")
        # self.qi_session.send(data)

    def connect(self):
        print("Trying to connect")
        self.send("connect"
            # command="connect",
            # args=[]
        )
        self.value = "Cooonnect"

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
    