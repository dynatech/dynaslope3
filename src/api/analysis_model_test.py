"""
    Just a way to test if all analysis models are working fine.
"""

from run import APP
from src.models.analysis import AnalysisEarthquakeAlerts
from src.models.analysis import AnalysisEarthquakeEvents
from src.models.analysis import AnalysisMarkerObservations
from src.models.analysis import AnalysisMarkerAlerts
from src.models.analysis import AnalysisMarkers
from src.models.analysis import AnalysisMarkerData
from src.models.analysis import AnalysisMarkerNames
from src.models.analysis import AnalysisMarkerHistory
from src.models.analysis import AnalysisRainfallAlerts
from src.models.analysis import AnalysisRainfallThresholds
from src.models.analysis import AnalysisRainfallGauges
from src.models.analysis import AnalysisRainfallPriorities
from src.models.analysis import AnalysisTSMSensors
from src.models.analysis import AnalysisTSMAlerts


print(APP)

AEA = AnalysisEarthquakeAlerts.query.first()
print(AEA)
print()

AEE = AnalysisEarthquakeEvents.query.first()
print(AEE)
print()

AMO = AnalysisMarkerObservations.query.first()
print(AMO)
print()

AME = AnalysisMarkerAlerts.query.first()
print(AME)
print()

AMA = AnalysisMarkerAlerts.query.first()
print(AMA)
print()

AM = AnalysisMarkers.query.first()
print(AM)
print()

AMD = AnalysisMarkerData.query.first()
print(AMD)
print()

AMN = AnalysisMarkerNames.query.first()
print(AMN)
print()

AMH = AnalysisMarkerHistory.query.first()
print(AMH)
print()

ARA = AnalysisRainfallAlerts.query.first()
print(ARA)
print()

ART = AnalysisRainfallThresholds.query.first()
print(ART)
print()

ARG = AnalysisRainfallGauges.query.first()
print(ARG)
print()

ARP = AnalysisRainfallPriorities.query.first()
print(ARP)
print()

ATS = AnalysisTSMSensors.query.first()
print(ATS)
print()

ATA = AnalysisTSMAlerts.query.first()
print(ATA)
print()
