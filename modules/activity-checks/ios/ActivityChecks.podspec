Pod::Spec.new do |s|
  s.name           = 'ActivityChecks'
  s.version        = '1.0.0'
  s.summary        = 'Checks off Live Activity tasks natively, even when the app is not running'
  s.description    = s.summary
  s.license        = 'MIT'
  s.author         = 'Life flow'
  s.homepage       = 'https://github.com/jameslporter/life-flow'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/jameslporter/life-flow.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
