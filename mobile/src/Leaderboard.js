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

import { Avatar } from '@doubledutch/rn-client'
import colors from './colors'

export default class Leaderboard extends PureComponent {
  render() {
    const { leaderboard } = this.props
    return (
      <View>
        {leaderboard.map((p, i) => (
          <View key={i} style={s.tile}>
            <Text style={i === 0 ? s.place2 : s.place}>{p.place}</Text>
            <Avatar user={p.user} size={i === 0 ? 45 : 35} style={s.avatar} />
            <Text style={i === 0 ? s.name2 : s.name} numberOfLines={1}>
              {p.user.firstName} {p.user.lastName}
            </Text>
            <View style={s.column}>
              <Text style={i === 0 ? s.points2 : s.points}>
                {p.score} {p.score === 1 ? 'pt' : 'pts'}
              </Text>
              {p.score > 0 ? <Text style={s.time}>Avg {p.time ? Math.round(10*(p.time / p.score / 1000))/10 : 0} s</Text> : null}
            </View>
          </View>
        ))}
      </View>
    )
  }
}
const s = StyleSheet.create({
  tile: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 5,
    flexDirection: "row"
  },
  row: {
    flexDirection: "column"
  },
  place: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 22,
  },
  time: {
    marginTop: 0,
    color: colors.orange,
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
