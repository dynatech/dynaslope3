"""
    Just a way to test if all monitoring models are working fine.
"""

from run import APP
from src.models.monitoring import MonitoringEvents
from src.models.monitoring import MonitoringReleases
from src.models.monitoring import MonitoringTriggers
from src.models.monitoring import MonitoringAlertStatus
from src.models.monitoring import MonitoringBulletinTracker
from src.models.monitoring import MonitoringOperationalTriggers
from src.models.monitoring import MonitoringOperationalTriggersSymbols
from src.models.monitoring import MonitoringTriggerHierarchies
from src.models.monitoring import MonitoringInternalAlertSymbols
from src.models.monitoring import MonitoringEndOfShiftAnalysis
from src.models.monitoring import MonitoringIssuesAndReminders
from src.models.monitoring import MonitoringLUTAlerts
from src.models.monitoring import MonitoringLUTResponses
from src.models.monitoring import MonitoringLUTTriggers
from src.models.monitoring import MonitoringManifestationFeatures
from src.models.monitoring import MonitoringNarratives
from src.models.monitoring import MonitoringEQ
from src.models.monitoring import MonitoringManifestation
from src.models.monitoring import MonitoringOnDemand
from src.models.monitoring import MonitoringSymbols

ME = MonitoringEvents.query.first()
print(ME)
print()

MR = MonitoringReleases.query.first()
print(MR)
print()

MT = MonitoringTriggers.query.first()
print(MT)
print()

MA = MonitoringAlertStatus.query.first()
print(MA)
print()

MB = MonitoringBulletinTracker.query.first()
print(MB)
print()

MOT = MonitoringOperationalTriggers.query.first()
print(MOT)
print()

MOTS = MonitoringOperationalTriggersSymbols.query.first()
print(MOTS)
print()

MTH = MonitoringTriggerHierarchies.query.first()
print(MTH)
print()

MIAS = MonitoringInternalAlertSymbols.query.first()
print(MIAS)
print()

MEOS = MonitoringEndOfShiftAnalysis.query.first()
# MEOS = MonitoringEndOfShiftAnalysis.query.all()
print(MEOS)
print()

MIAR = MonitoringIssuesAndReminders.query.first()
print(MIAR)
print()

MLA = MonitoringLUTAlerts.query.first()
# MLA = MonitoringLUTAlerts.query.all()
print(MLA)
print()

MLR = MonitoringLUTResponses.query.first()
# MLR = MonitoringLUTResponses.query.all()
print(MLR)
print()

MLT = MonitoringLUTTriggers.query.first()
print(MLT)
print()

MMF = MonitoringManifestationFeatures.query.first()
print(MMF)
print()

MN = MonitoringNarratives.query.first()
print(MN)
print()

MEQ = MonitoringEQ.query.first()
print(MEQ)
print()

MM = MonitoringManifestation.query.first()
print(MM)
print()

MOD = MonitoringOnDemand.query.first()
print(MOD)
print()

MSY = MonitoringSymbols.query.first()
print(MSY)
print()
