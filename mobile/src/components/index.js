/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {PureComponent} from 'React'
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native'

export class Button extends PureComponent {
  render() {
    const {onPress, title} = this.props
    let {backgroundColor, color} = this.props
    if (!backgroundColor) backgroundColor = '#2da99f'
    if (!color) color = '#fff'
    return (
      <TouchableOpacity style={[s.button, {backgroundColor}]} onPress={onPress}>
        <Text style={[s.buttonText, {color}]}>{title}</Text>
      </TouchableOpacity>
    )
  }
}

const s = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  buttonText: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    fontSize: 20,
  },
})