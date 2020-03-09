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
import { View, StyleSheet, WebView, Text } from 'react-native'
import { translate as t } from '@doubledutch/rn-client'
import Loading from './Loading'
import colors from './colors'

export default class Admin extends PureComponent {
  state = {
    pageLoading: true,
  }
  render() {
    const { pageLoading } = this.state
    const uri = this.buildCompleteUrl()
    return (
      <View style={s.container}>
        {pageLoading && <Loading />}
        <View style={pageLoading ? s.webHidden : s.web}>
          <WebView
            source={{
              uri,
            }}
            useWebKit={true}
            onLoadEnd={ ()=>this.setState({pageLoading: false}) }
          />
        </View>
      </View>
    )
  }

  buildCompleteUrl = () => {
    const { sessionId, sessionName, url } = this.props
    const newUrl = `&sessionId=${encodeURIComponent(sessionId)}&sessionName=${encodeURIComponent(
      sessionName,
    )}`
    return url + newUrl
  }
}
const s = StyleSheet.create({
  web: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  webHidden: {
    height: 1,
    width: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  boxLeft: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  bottom: {
    marginBottom: 50,
  },
  desText: {
    fontSize: 18,
    color: '#364347',
  },
  titleText: {
    marginBottom: 5,
    fontSize: 28,
    fontWeight: '600',
    color: '#364347',
  },
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
})
