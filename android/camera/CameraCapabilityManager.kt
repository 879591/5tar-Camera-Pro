package com.fivestar.camerapro.camera

import android.content.Context
import android.graphics.ImageFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.os.Build
import android.util.Range
import android.util.Size

data class PhysicalLensCapability(
    val cameraId: String,
    val facing: Int,
    val focalLengthsMm: FloatArray,
    val opticalTypeLabel: String,
    val isoRange: Range<Int>?,
    val exposureTimeRangeNs: Range<Long>?,
    val compensationRange: Range<Int>?,
    val maxDigitalZoom: Float,
    val minimumFocusDistanceDiopters: Float,
    val supportsManualSensor: Boolean,
    val supportsRawCapture: Boolean,
    val supportsOpticalStabilization: Boolean,
    val supportsFlashUnit: Boolean,
    val supportedVideoSizes: List<Size>,
    val supportedHighSpeedFpsRanges: List<Range<Int>>
)

/**
 * 5tar Camera Pro — Hardware Capability Detection Engine
 * Queries real Android CameraCharacteristics for Samsung, Pixel, Xiaomi/Redmi, Vivo, Realme, OnePlus, Motorola.
 * Never assumes a lens or FPS exists without verifying hardware capabilities first.
 */
class CameraCapabilityManager(context: Context) {
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager

    fun queryAllCameraCapabilities(): List<PhysicalLensCapability> {
        val result = mutableListOf<PhysicalLensCapability>()
        for (cameraId in cameraManager.cameraIdList) {
            try {
                val chars = cameraManager.getCameraCharacteristics(cameraId)
                val facing = chars.get(CameraCharacteristics.LENS_FACING)
                    ?: CameraCharacteristics.LENS_FACING_BACK
                val focalLengths = chars.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS)
                    ?: floatArrayOf(4.2f)

                val capabilities = chars.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES)
                    ?: intArrayOf()
                val supportsManualSensor =
                    capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_MANUAL_SENSOR)
                val supportsRaw =
                    capabilities.contains(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES_RAW)

                val isoRange = chars.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE)
                val exposureTimeRange = chars.get(CameraCharacteristics.SENSOR_INFO_EXPOSURE_TIME_RANGE)
                val aeCompRange = chars.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_RANGE)
                val maxZoom = chars.get(CameraCharacteristics.SCALER_AVAILABLE_MAX_DIGITAL_ZOOM) ?: 1.0f
                val minFocusDist = chars.get(CameraCharacteristics.LENS_INFO_MINIMUM_FOCUS_DISTANCE) ?: 0f
                val hasFlash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
                val oisModes = chars.get(CameraCharacteristics.LENS_INFO_AVAILABLE_OPTICAL_STABILIZATION)
                val hasOis = oisModes?.contains(CameraMetadata.LENS_OPTICAL_STABILIZATION_MODE_ON) == true

                val streamMap = chars.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
                val videoSizes = streamMap?.getOutputSizes(android.media.MediaRecorder::class.java)?.toList()
                    ?: emptyList()
                val highSpeedRanges = try {
                    streamMap?.highSpeedVideoFpsRanges?.toList() ?: emptyList()
                } catch (_: Throwable) {
                    emptyList()
                }

                val firstFocal = focalLengths.firstOrNull() ?: 4.2f
                val opticalLabel = when {
                    facing == CameraCharacteristics.LENS_FACING_FRONT -> "Front Selfie"
                    firstFocal < 2.5f -> "Ultra-Wide"
                    firstFocal > 6.5f -> "Telephoto"
                    minFocusDist > 12f -> "Macro"
                    else -> "Wide (Main)"
                }

                result.add(
                    PhysicalLensCapability(
                        cameraId = cameraId,
                        facing = facing,
                        focalLengthsMm = focalLengths,
                        opticalTypeLabel = opticalLabel,
                        isoRange = isoRange,
                        exposureTimeRangeNs = exposureTimeRange,
                        compensationRange = aeCompRange,
                        maxDigitalZoom = maxZoom,
                        minimumFocusDistanceDiopters = minFocusDist,
                        supportsManualSensor = supportsManualSensor,
                        supportsRawCapture = supportsRaw,
                        supportsOpticalStabilization = hasOis,
                        supportsFlashUnit = hasFlash,
                        supportedVideoSizes = videoSizes,
                        supportedHighSpeedFpsRanges = highSpeedRanges
                    )
                )
            } catch (_: Exception) {
                // Gracefully skip restricted OEM auxiliary sensor IDs
            }
        }
        return result
    }

    fun supportsHardwareSlowMotion120Or240(lens: PhysicalLensCapability): Boolean {
        return lens.supportedHighSpeedFpsRanges.any { it.upper >= 120 }
    }
}
