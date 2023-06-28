// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Add any needed widget imports here (or from controls)
// import {} from '@jupyter-widgets/base';

import { createTestModel } from './utils';

import { NaoRobotModel } from '..';

describe('NaoRobot', () => {
  describe('NaoRobotModel', () => {
    it('should be createable', () => {
      const model = createTestModel(NaoRobotModel);
      expect(model).toBeInstanceOf(NaoRobotModel);
      expect(model.get('connected')).toEqual('Disconnected');
    });

    it('should be createable with a value', () => {
      const state = { connected: 'Foo Bar!' };
      const model = createTestModel(NaoRobotModel, state);
      expect(model).toBeInstanceOf(NaoRobotModel);
      expect(model.get('connected')).toEqual('Foo Bar!');
    });
  });
});
