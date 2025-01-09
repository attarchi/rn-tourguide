import React, { Component } from 'react'
import {
  Dimensions,
  LayoutChangeEvent,
  Platform,
  Pressable,
  PressableProps,
  ScaledSize,
  StyleSheet,
} from 'react-native'
import { IStep, ValueXY } from '../types'
import styles from './style'

interface Props {
  size: ValueXY
  position: ValueXY
  dismissOnPress?: boolean
  maskOffset?: number
  currentStep?: IStep
  stop: () => void
  preventOutsideInteraction?: boolean
}

interface State {
  size: ValueXY
  position: ValueXY
  canvasSize: ValueXY
}

export class NonInteractionPlaceholder extends Component<Props, State> {
  windowDimensions: ScaledSize | null = null

  constructor(props: Props) {
    super(props)

    this.windowDimensions = Platform.select({
      android: Dimensions.get('screen'),
      default: Dimensions.get('window'),
    })

    this.state = {
      canvasSize: {
        x: this.windowDimensions.width,
        y: this.windowDimensions.height,
      },
      size: props.size,
      position: props.position,
    }
  }

  handleLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }: LayoutChangeEvent) => {
    this.setState({
      canvasSize: {
        x: width,
        y: height,
      },
    })
  }

  render() {
    if (!this.state.canvasSize) {
      return null
    }

    const { position, size, dismissOnPress, preventOutsideInteraction, stop } =
      this.props
    const { canvasSize } = this.state
    const pressableProps: PressableProps = {
      pointerEvents:
        dismissOnPress || preventOutsideInteraction ? undefined : 'none',
      onPress: dismissOnPress ? stop : undefined,
      hitSlop: 0,
    }

    if (this.props.currentStep?.pressable) {
      return (
        <>
          <Pressable
            {...pressableProps}
            style={[
              StyleSheet.absoluteFill,
              styles.nonInteractionPlaceholder,
              {
                bottom: canvasSize.y - position.y,
              },
            ]}
          />
          <Pressable
            {...pressableProps}
            style={[
              StyleSheet.absoluteFill,
              styles.nonInteractionPlaceholder,
              {
                top: position.y + size.y,
              },
            ]}
          />
          <Pressable
            {...pressableProps}
            style={[
              StyleSheet.absoluteFill,
              styles.nonInteractionPlaceholder,
              {
                top: position.y,
                bottom: canvasSize.y - position.y - size.y,
                right: canvasSize.x - position.x,
              },
            ]}
          />
          <Pressable
            {...pressableProps}
            style={[
              StyleSheet.absoluteFill,
              styles.nonInteractionPlaceholder,
              {
                top: position.y,
                bottom: canvasSize.y - position.y - size.y,
                left: position.x + size.x,
              },
            ]}
          />
        </>
      )
    } else {
      return (
        <Pressable
          {...pressableProps}
          onLayout={this.handleLayout}
          style={[StyleSheet.absoluteFill, styles.nonInteractionPlaceholder]}
        />
      )
    }
  }
}
