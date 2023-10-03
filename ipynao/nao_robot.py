#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Isabel Paredes.
# Distributed under the terms of the Modified BSD License.

'''
TODO: Add module docstring
'''

from ipywidgets import DOMWidget, Output
from traitlets import Unicode, Integer
from ._frontend import module_name, module_version
from asyncio import ensure_future, Future
from IPython.display import display


class NaoRobotService():
    name = None
    widget = None

    def __init__(self, widget, service_name):
        self.name = service_name
        self.widget = widget

    def _create_msg(self, method_name, *args, **kwargs):
        data = {}
        data['command'] = 'callService'
        data['service'] = str(self.name)
        data['method']  = str(method_name)
        # convert tuple to list to avoid empty arg values
        data['args']    = list(args)
        data['kwargs']  = kwargs
        data['requestID'] = self.widget.request_id
        self.widget.request_id += 1
        return data
    

    async def call_service(self, method_name, *args, **kwargs):
        data = self._create_msg(method_name, *args, **kwargs)
        self.widget.send(data)
        request_id = data['requestID']

        output = Output()
        display(output)
        output.append_stdout(f'Calling service {self.name}...\n')
        future = await self.widget.wait_for_change('counter', output, request_id)

        return future
        

    def __getattr__(self, method_name):
        return lambda *x, **y: ensure_future(self.call_service(method_name, *x, **y))


class Robot():

    def __init__(self) -> None:
        self.widget = NaoRobotWidget()
        display(self.widget)

    
    def _create_service(self, service_name):
        data = {}
        data['command'] = str('createService')
        data['service'] = str(service_name)
        data['requestID'] = self.widget.request_id
        self.widget.send(data)
        self.widget.request_id += 1
        return NaoRobotService(self.widget, service_name)
        # TODO: wait for service to become available

    
    def connect(self, ip_address='nao.local', port='80'):
        data = {}
        data['command'] = str('connect')
        data['ipAddress'] = str(ip_address)
        data['port'] = str(port)
        data['requestID'] = self.widget.request_id
        self.widget.send(data)
        self.widget.request_id += 1

    
    def disconnect(self):
        data = {}
        data['command'] = str('disconnect')
        data['requestID'] = self.request_id
        self.send(data)
        self.request_id += 1


    def __getattr__(self, service_name):
        print("Service: " + str(service_name)) # REMOVE
        return self._create_service(service_name)
    

class NaoRobotWidget(DOMWidget):
    _model_name = Unicode('NaoRobotModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('NaoRobotView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    connected = Unicode('Disconnected').tag(sync=True)
    status = Unicode('Not busy').tag(sync=True)
    counter = Integer(0).tag(sync=True)
    response = {}
    request_id = 0


    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.on_msg(self._handle_frontend_msg)


    def _handle_frontend_msg(self, model, msg, buffer):
        request_id = msg['requestID']
        self.response[request_id] = {
            'isError': msg['isError'],
            'data':    msg['data']
        }


    def wait_for_change(widget, value_name, output=Output(), request_id=0):
        future = Future()
        widget.response[request_id] = {
            'isError': False,
            'data': None
        }

        def get_value_change(change):
            response = widget.response[request_id]

            if (response['data'] != None): 
                widget.unobserve(get_value_change, names=value_name)

                if (response['isError']):
                    if not future.done():
                        # TODO: Fix "Task exception was never retrieved"
                        # future.set_exception(Exception(response['data']))
                        future.set_result(Exception(response['data']))
                    output.append_stderr(str(response['data']) + '\n')
                else:
                    if not future.done():
                        future.set_result(response['data'])
                    output.append_stdout(str(response['data']) + '\n')

        
        widget.observe(get_value_change, names=value_name)
        return future
