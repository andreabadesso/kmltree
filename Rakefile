require 'rake/clean'

CLEAN.include('dist/kmltree.css', 'dist/kmltree.min.js', 'dist/kmltree.js', 'dist/images', 'src/_sprites.sass', 'sprites-url')
CLOBBER.include('compiler')

SRC = FileList[ 'src/tmpl.js', 'src/kmldom.js', 'src/kmltree.js']

task :default => ["kmltree.tar.gz"]

file "kmltree.tar.gz" => ["dist/kmltree.css", "dist/kmltree.min.js", "dist/images"] do
  sh "cp -r dist kmltree"
  sh "tar -pczf latest.tar.gz kmltree"
  sh "rm -rf kmltree"
end

file "dist/kmltree.css" => ["clean", "src/main.sass", "src/_sprites.sass"] do
  sh "sass src/main.sass dist/kmltree.css"
  sh "sed 's:/sprites-url/::' dist/kmltree.css > out"
  rm "dist/kmltree.css"
  mv "out", "dist/kmltree.css"
end

file "src/_sprites.sass" => ['config/sprite.yml'] do
  sh "sprite"
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

file "dist/images" => ["src/_sprites.sass"] do
  sh "cp -r src/sprites-url/images dist/"
  sh "rm -rf src/sprites-url"
  sh "cp src/images/kml-throbber.gif dist/images/"
end