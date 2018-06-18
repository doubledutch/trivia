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
import { Text, View, StyleSheet } from 'react-native'

import {Avatar} from '@doubledutch/rn-client'
import colors from './colors'

export default class Leaderboard extends PureComponent {
  render() {
    const {leaderboard, currentUserId} = this.props
    return (
      <View>
        { leaderboard.map((p,i) => (
          i === 0 ? this.renderFirstPosition(p, i) : <View key={i} style={s.tile}>
            <Text style={s.place}>{p.place}</Text>
            <Avatar user={p.user} size={35} style={s.avatar} />
            <Text style={s.name} numberOfLines={1}>{p.user.firstName} {p.user.lastName}</Text>
            <Text style={s.points}>{p.score} {p.score === 1 ? 'pt':'pts'}</Text>
          </View>
        ))}
      </View>
    )
  }
}

renderFirstPosition = (p, i) => {
  return (
    <View key={i} style={s.tile}>
      <Text style={s.place}>{p.place}</Text>
      <Avatar user={p.user} size={45} style={s.avatar} />
      <Text style={s.name} numberOfLines={1}>{p.user.firstName} {p.user.lastName}</Text>
      <Text style={s.points}>{p.score} {p.score === 1 ? 'pt':'pts'}</Text>
    </View>
  )
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
  },
  points2: {
    color: colors.orange,
    fontSize: 18,
  }
})
