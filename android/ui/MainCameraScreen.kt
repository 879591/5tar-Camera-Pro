package com.fivestar.camerapro.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fivestar.camerapro.camera.PhysicalLensCapability

/**
 * 5tar Camera Pro — Jetpack Compose Pro Dark Viewfinder Screen
 * Adapts dynamically to detected PhysicalLensCapability list.
 */
@Composable
fun MainCameraScreen(
    detectedLenses: List<PhysicalLensCapability>,
    onCapturePhoto: () -> Unit,
    onToggleVideo: () -> Unit
) {
    var selectedMode by remember { mutableStateOf("PRO") }
    var selectedIso by remember { mutableStateOf("AUTO") }
    var selectedShutter by remember { mutableStateOf("AUTO") }
    val activeLens = detectedLenses.firstOrNull()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0C))
            .padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Top HUD Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "5tar Camera Pro",
                color = Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = activeLens?.opticalTypeLabel ?: "Wide (Main)",
                color = Color(0xFFF59E0B),
                fontSize = 12.sp
            )
        }

        // Pro Manual Deck (Adapts to supportsManualSensor)
        if (selectedMode == "PRO") {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF131418), RoundedCornerShape(16.dp))
                    .padding(12.dp)
            ) {
                if (activeLens?.supportsManualSensor == true) {
                    Text(
                        text = "ISO Range: ${activeLens.isoRange?.lower} - ${activeLens.isoRange?.upper} | Selected: $selectedIso",
                        color = Color(0xFFF59E0B),
                        fontSize = 12.sp
                    )
                    Text(
                        text = "Shutter Speed: $selectedShutter",
                        color = Color.White,
                        fontSize = 12.sp
                    )
                } else {
                    Text(
                        text = "Not supported on this camera — Automatic fallback active",
                        color = Color.LightGray,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // Bottom Mode Rail & Tactile Shutter
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                listOf("PHOTO", "PORTRAIT", "PRO", "VIDEO", "SLOW MOTION", "TIME LAPSE").forEach { mode ->
                    Text(
                        text = mode,
                        color = if (selectedMode == mode) Color(0xFFF59E0B) else Color.Gray,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable { selectedMode = mode }
                    )
                }
            }

            Box(
                modifier = Modifier
                    .size(76.dp)
                    .border(4.dp, Color(0xFFF59E0B), CircleShape)
                    .padding(6.dp)
                    .background(Color.White, CircleShape)
                    .clickable {
                        if (selectedMode == "VIDEO" || selectedMode == "SLOW MOTION") {
                            onToggleVideo()
                        } else {
                            onCapturePhoto()
                        }
                    }
            )
        }
    }
}
