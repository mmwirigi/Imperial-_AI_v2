package ke.imperialenterprise.imperialai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ke.imperialenterprise.imperialai.ui.theme.*

@Composable
fun ImperialTopBar(
    title: String,
    activeSiteName: String? = null,
    onSelectSiteClicked: (() -> Unit)? = null
) {
    Surface(
        color = ObsidianSurface,
        modifier = Modifier
            .fillMaxWidth()
            .border(width = 1.dp, color = BorderHairline)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Zone 1: Brand title
            Column {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = "Imperial AI",
                        tint = ImperialGoldPrimary,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "IMPERIAL AI",
                        style = MaterialTheme.typography.titleLarge,
                        color = TextHighEmphasis,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = "WordPress Command Center",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMediumEmphasis,
                    fontSize = 10.sp
                )
            }

            // Zone 2 / 3: Active site selector context or screen label
            if (activeSiteName != null && onSelectSiteClicked != null) {
                Surface(
                    color = CardSurface,
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier
                        .border(1.dp, BorderSubtle, RoundedCornerShape(6.dp))
                        .clip(RoundedCornerShape(6.dp))
                        .clickable { onSelectSiteClicked() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(ImperialGoldPrimary, RoundedCornerShape(3.dp))
                        )
                        Text(
                            text = activeSiteName,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextHighEmphasis,
                            maxLines = 1
                        )
                        Icon(
                            imageVector = Icons.Default.ArrowDropDown,
                            contentDescription = "Change Site",
                            tint = TextMediumEmphasis,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            } else {
                Text(
                    text = title.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = ImperialGoldPrimary,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
