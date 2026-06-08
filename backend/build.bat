@echo off
set MAVEN_HOME=C:\Users\POOJAJ~1\maven\apache-maven-3.9.14
set PATH=%MAVEN_HOME%\bin;%PATH%
cd /d C:\wifibuild
mvn package -DskipTests
