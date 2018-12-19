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

import React, { PureComponent } from 'react'
import { View, StyleSheet, WebView } from 'react-native'
import colors from './colors'

export default class Admin extends PureComponent {
  render() {
    const uri = this.updateUrl()
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <WebView
          source={{
            uri,
          }}
        />
      </View>
    )
  }

  updateUrl = () => {
    const { sessionId, sessionName, url } = this.props
    const newUrl = `&sessionId=${encodeURIComponent(sessionId)}&sessionName=${encodeURIComponent(
      sessionName,
    )}`
    return url + newUrl
  }
}
const s = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  place: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 22,
  },
  avatar: {
    marginHorizontal: 11,
  },
  name: {
    flex: 1,
    color: colors.purple,
    fontSize: 18,
  },
  points: {
    color: colors.orange,
    fontSize: 16,
  },
  place2: {
    color: colors.orange,
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 22,
  },
  name2: {
    flex: 1,
    color: colors.purple,
    fontSize: 20,
    fontWeight: 'bold',
  },
  points2: {
    color: colors.orange,
    fontSize: 18,
    fontWeight: 'bold',
  },
})
