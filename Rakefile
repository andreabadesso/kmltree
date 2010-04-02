require 'rake/clean'

CLEAN.include('dist/kmltree.css', 'dist/kmltree.min.js', 'dist/kmltree.js')
CLOBBER.include('compiler')

SRC = FileList[ 'src/tmpl.js', 'src/kmldom.js', 'src/openBalloon.js', 
  'src/kmltree.js']

task :default => ["dist/kmltree.css", "dist/kmltree.min.js"]

file "dist/kmltree.css" => ["clean", "src/main.sass"] do
  sh "sass src/main.sass dist/kmltree.css"
end

file "dist/kmltree.min.js" => ['dist/kmltree.js', 'compiler/compiler.jar'] do 
  cmd = "java -jar compiler/compiler.jar "
  cmd << "--js dist/kmltree.js "
  cmd << "--js_output_file dist/kmltree.min.js"
  sh cmd
end

file "compiler/compiler.jar" do
  mkdir "compiler"
  cd "compiler"
  url = "http://closure-compiler.googlecode.com/files/compiler-latest.zip"
  sh "curl -O #{url}"
  sh "unzip compiler-latest.zip"
  cd "../"
end

file "dist/kmltree.js" do
  cmd = 'cat'
  SRC.each do |f|
    cmd << " #{f}"
  end
  cmd << " > dist/kmltree.js"
  sh cmd
end