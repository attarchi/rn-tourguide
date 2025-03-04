import * as React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { BorderRadiusObject, IStep, Shape } from '../types'
import { TourGuideZone } from './TourGuideZone'

export interface TourGuideZoneByPositionProps {
  zone: number
  tourKey?: string
  isTourGuide?: boolean
  top?: number | string
  left?: number | string
  right?: number | string
  bottom?: number | string
  width?: number | string
  height?: number | string
  shape?: Shape
  borderRadiusObject?: BorderRadiusObject
  containerStyle?: StyleProp<ViewStyle>
  keepTooltipPosition?: boolean
  tooltipBottomOffset?: number
  text?: string
  withoutButtons?: boolean
  pressable?: boolean
  onNext?: (
    currentStep: IStep | undefined,
    nextStep: IStep | undefined,
  ) => void | 'stop' | 'doNothing'
  onPrevious?: (
    currentStep: IStep | undefined,
    nextStep: IStep | undefined,
  ) => void | 'stop' | 'doNothing'
}

export const TourGuideZoneByPosition = ({
  isTourGuide,
  zone,
  tourKey = '_default',
  width,
  height,
  top,
  left,
  right,
  bottom,
  shape,
  containerStyle,
  keepTooltipPosition,
  tooltipBottomOffset,
  borderRadiusObject,
  text,
  withoutButtons,
  pressable,
  onNext,
  onPrevious,
}: TourGuideZoneByPositionProps) => {
  if (!isTourGuide) {
    return null
  }

  return (
    <View
      pointerEvents='none'
      style={[StyleSheet.absoluteFillObject, containerStyle]}
    >
      <TourGuideZone
        isTourGuide
        {...{
          tourKey,
          zone,
          shape,
          keepTooltipPosition,
          tooltipBottomOffset,
          borderRadiusObject,
          text,
          withoutButtons,
          pressable,
          onNext,
          onPrevious,
        }}
        style={{
          position: 'absolute',
          height,
          width,
          top,
          right,
          bottom,
          left,
        }}
      />
    </View>
  )
}
