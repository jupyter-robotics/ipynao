#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Isabel Paredes.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

from ipywidgets import DOMWidget
from traitlets import Unicode
from ._frontend import module_name, module_version


class NaoRobotWidget(DOMWidget):
    """TODO: Add docstring here
    """
    _model_name = Unicode('NaoRobotModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    # _model_id = Unicode('NaoRobotID').tag(sync=True)
    _view_name = Unicode('NaoRobotView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    value = Unicode('Hello World').tag(sync=True)

    # def __init__(self):
    #     # self.qi_session = qi_session
    #     print("RRR I'm initting")

    # def send(self, command, args):
    #     data = {}
    #     data["command"] = str(command)
    #     data["args"] = args
    #     # self.qi_session.send(data)

    # def connect(self):
    #     print("Trying to connect")
    #     self.send(
    #         command="connect",
    #         args=[]
    #     )

    