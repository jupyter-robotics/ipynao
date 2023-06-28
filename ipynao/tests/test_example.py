#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Isabel Paredes.
# Distributed under the terms of the Modified BSD License.

import pytest

from ..nao_robot import NaoRobotWidget


def test_nao_robot_creation_blank():
    w = NaoRobotWidget()
    assert w.connected == 'Disconnected'
